import { Express } from "express";
import { EventRecorder, IDomainEvent } from "../../src/core/events";
import { IEventPublisherPort } from "../../src/core/ports";
import {
  NotificationPolicy,
  OrganizationAccess,
  OrganizationCache,
} from "../../src/core/services";
import {
  AddMemberUseCase,
  ChangeMemberRoleUseCase,
  CheckReadinessUseCase,
  CreateOrganizationUseCase,
  CreateUserUseCase,
  DispatchNotificationUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
  GetOrganizationUseCase,
  HandleDomainEventUseCase,
  ListAuditEventsUseCase,
  ListMembersUseCase,
  ListUserNotificationsUseCase,
  ListUserOrganizationsUseCase,
  LoginUseCase,
  LogoutUseCase,
  RemoveMemberUseCase,
  RenameOrganizationUseCase,
} from "../../src/core/use-cases";
import {
  ActivityController,
  AuthController,
  HealthController,
  MembershipController,
  OrganizationController,
  UserController,
} from "../../src/infrastructure/adapters/api/express/controllers";
import { createApp } from "../../src/infrastructure/adapters/api/express/server";
import { JwtTokenService } from "../../src/infrastructure/adapters/security";
import { CryptoIdGenerator } from "../../src/infrastructure/adapters/system";
import {
  InMemoryAuditEventRepository,
  InMemoryNotificationRepository,
} from "./InMemoryDocumentStores";
import { InMemoryMembershipRepository } from "./InMemoryMembershipRepository";
import { InMemoryOrganizationRepository } from "./InMemoryOrganizationRepository";
import { InMemoryUserRepository } from "./InMemoryUserRepository";
import {
  FakePasswordHasher,
  InMemoryCache,
  InMemoryRevokedTokenStore,
  RecordingNotificationScheduler,
  RecordingNotificationSender,
  SilentLogger,
} from "./fakes";
import { loadTestEnv } from "./testEnv";

class PipelineEventPublisher implements IEventPublisherPort {
  public readonly published: IDomainEvent[] = [];

  constructor(
    private readonly handleDomainEvent: HandleDomainEventUseCase,
    private readonly dispatchNotification: DispatchNotificationUseCase,
    private readonly scheduler: RecordingNotificationScheduler
  ) {}

  public async publish(event: IDomainEvent): Promise<void> {
    this.published.push(event);

    await this.handleDomainEvent.Execute(event);

    for (const notificationId of this.scheduler.Drain()) {
      await this.dispatchNotification.Execute(notificationId);
    }
  }

  public Names(): string[] {
    return this.published.map((event) => event.name);
  }
}

export interface ITestApp {
  app: Express;
  users: InMemoryUserRepository;
  organizations: InMemoryOrganizationRepository;
  memberships: InMemoryMembershipRepository;
  notifications: InMemoryNotificationRepository;
  auditEvents: InMemoryAuditEventRepository;
  cache: InMemoryCache;
  publisher: PipelineEventPublisher;
  sender: RecordingNotificationSender;
  revokedTokens: InMemoryRevokedTokenStore;
}

export const buildTestApp = (): ITestApp => {
  const env = loadTestEnv();
  const logger = new SilentLogger();
  const idGenerator = new CryptoIdGenerator();
  const clock = { now: (): Date => new Date() };
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new JwtTokenService(
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
    idGenerator
  );

  const memberships = new InMemoryMembershipRepository();
  const organizations = new InMemoryOrganizationRepository(memberships);
  const users = new InMemoryUserRepository();
  const notifications = new InMemoryNotificationRepository();
  const auditEvents = new InMemoryAuditEventRepository();
  const cache = new InMemoryCache();
  const scheduler = new RecordingNotificationScheduler();
  const sender = new RecordingNotificationSender();
  const revokedTokens = new InMemoryRevokedTokenStore();

  const publisher = new PipelineEventPublisher(
    new HandleDomainEventUseCase(
      auditEvents,
      notifications,
      scheduler,
      users,
      new NotificationPolicy(),
      clock,
      logger
    ),
    new DispatchNotificationUseCase(notifications, sender, clock, logger),
    scheduler
  );

  const eventRecorder = new EventRecorder(
    publisher,
    idGenerator,
    clock,
    logger
  );

  const organizationAccess = new OrganizationAccess(organizations, memberships);
  const organizationCache = new OrganizationCache(
    cache,
    memberships,
    env.CACHE_TTL_SECONDS
  );

  const app = createApp({
    env,
    logger,
    idGenerator,
    tokenService,
    revokedTokenStore: revokedTokens,
    userController: new UserController({
      createUserUseCase: new CreateUserUseCase(
        users,
        passwordHasher,
        idGenerator,
        clock,
        eventRecorder
      ),
      findAllUsersUseCase: new FindAllUsersUseCase(users),
      findUserByEmailUseCase: new FindUserByEmailUseCase(users),
    }),
    authController: new AuthController(
      new LoginUseCase(users, passwordHasher, tokenService, eventRecorder),
      new LogoutUseCase(revokedTokens, eventRecorder)
    ),
    organizationController: new OrganizationController({
      createOrganizationUseCase: new CreateOrganizationUseCase(
        organizations,
        organizationCache,
        idGenerator,
        clock,
        eventRecorder
      ),
      listUserOrganizationsUseCase: new ListUserOrganizationsUseCase(
        organizations,
        organizationCache
      ),
      getOrganizationUseCase: new GetOrganizationUseCase(organizationAccess),
      renameOrganizationUseCase: new RenameOrganizationUseCase(
        organizationAccess,
        organizations,
        organizationCache,
        clock,
        eventRecorder
      ),
    }),
    membershipController: new MembershipController({
      addMemberUseCase: new AddMemberUseCase(
        organizationAccess,
        memberships,
        users,
        organizationCache,
        idGenerator,
        clock,
        eventRecorder
      ),
      listMembersUseCase: new ListMembersUseCase(
        organizationAccess,
        memberships,
        users
      ),
      changeMemberRoleUseCase: new ChangeMemberRoleUseCase(
        organizationAccess,
        memberships,
        clock,
        eventRecorder
      ),
      removeMemberUseCase: new RemoveMemberUseCase(
        organizationAccess,
        memberships,
        organizationCache,
        eventRecorder
      ),
    }),
    activityController: new ActivityController({
      listAuditEventsUseCase: new ListAuditEventsUseCase(
        organizationAccess,
        auditEvents
      ),
      listUserNotificationsUseCase: new ListUserNotificationsUseCase(
        notifications
      ),
    }),
    healthController: new HealthController(
      new CheckReadinessUseCase(
        [{ name: "memoria", check: async (): Promise<void> => undefined }],
        env.READINESS_TIMEOUT_MILLISECONDS
      )
    ),
  });

  return {
    app,
    users,
    organizations,
    memberships,
    notifications,
    auditEvents,
    cache,
    publisher,
    sender,
    revokedTokens,
  };
};
