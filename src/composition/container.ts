import { EventRecorder } from "../core/events";
import { ITokenServicePort } from "../core/ports";
import { OrganizationAccess, OrganizationCache } from "../core/services";
import {
  AddMemberUseCase,
  ChangeMemberRoleUseCase,
  CheckReadinessUseCase,
  CreateOrganizationUseCase,
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
  GetOrganizationUseCase,
  ListAuditEventsUseCase,
  ListMembersUseCase,
  ListUserNotificationsUseCase,
  ListUserOrganizationsUseCase,
  LoginUseCase,
  LogoutUseCase,
  RemoveMemberUseCase,
  RenameOrganizationUseCase,
} from "../core/use-cases";
import {
  ActivityController,
  AuthController,
  HealthController,
  MembershipController,
  OrganizationController,
  UserController,
} from "../infrastructure/adapters/api/express/controllers";
import { BullMqEventPublisher } from "../infrastructure/adapters/queue";
import {
  JwtTokenService,
  ScryptPasswordHasher,
} from "../infrastructure/adapters/security";
import {
  CryptoIdGenerator,
  SystemClock,
} from "../infrastructure/adapters/system";
import { Env } from "../infrastructure/config/env";
import { IInfrastructure } from "./infrastructure";

export interface IContainer {
  idGenerator: CryptoIdGenerator;
  tokenService: ITokenServicePort;
  userController: UserController;
  authController: AuthController;
  organizationController: OrganizationController;
  membershipController: MembershipController;
  activityController: ActivityController;
  healthController: HealthController;
}

export const buildContainer = (
  env: Env,
  infrastructure: IInfrastructure
): IContainer => {
  const { logger, repositories, queues } = infrastructure;

  const idGenerator = new CryptoIdGenerator();
  const clock = new SystemClock();
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = new JwtTokenService(
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
    idGenerator
  );

  const eventRecorder = new EventRecorder(
    new BullMqEventPublisher(queues.domainEvents),
    idGenerator,
    clock,
    logger
  );

  const organizationAccess = new OrganizationAccess(
    repositories.organizations,
    repositories.memberships
  );

  const organizationCache = new OrganizationCache(
    infrastructure.cache,
    repositories.memberships,
    env.CACHE_TTL_SECONDS
  );

  const userController = new UserController({
    createUserUseCase: new CreateUserUseCase(
      repositories.users,
      passwordHasher,
      idGenerator,
      clock,
      eventRecorder
    ),
    findAllUsersUseCase: new FindAllUsersUseCase(repositories.users),
    findUserByEmailUseCase: new FindUserByEmailUseCase(repositories.users),
  });

  const authController = new AuthController(
    new LoginUseCase(
      repositories.users,
      passwordHasher,
      tokenService,
      eventRecorder
    ),
    new LogoutUseCase(infrastructure.revokedTokenStore, eventRecorder)
  );

  const organizationController = new OrganizationController({
    createOrganizationUseCase: new CreateOrganizationUseCase(
      repositories.organizations,
      organizationCache,
      idGenerator,
      clock,
      eventRecorder
    ),
    listUserOrganizationsUseCase: new ListUserOrganizationsUseCase(
      repositories.organizations,
      organizationCache
    ),
    getOrganizationUseCase: new GetOrganizationUseCase(organizationAccess),
    renameOrganizationUseCase: new RenameOrganizationUseCase(
      organizationAccess,
      repositories.organizations,
      organizationCache,
      clock,
      eventRecorder
    ),
  });

  const membershipController = new MembershipController({
    addMemberUseCase: new AddMemberUseCase(
      organizationAccess,
      repositories.memberships,
      repositories.users,
      organizationCache,
      idGenerator,
      clock,
      eventRecorder
    ),
    listMembersUseCase: new ListMembersUseCase(
      organizationAccess,
      repositories.memberships,
      repositories.users
    ),
    changeMemberRoleUseCase: new ChangeMemberRoleUseCase(
      organizationAccess,
      repositories.memberships,
      clock,
      eventRecorder
    ),
    removeMemberUseCase: new RemoveMemberUseCase(
      organizationAccess,
      repositories.memberships,
      organizationCache,
      eventRecorder
    ),
  });

  const activityController = new ActivityController({
    listAuditEventsUseCase: new ListAuditEventsUseCase(
      organizationAccess,
      repositories.auditEvents
    ),
    listUserNotificationsUseCase: new ListUserNotificationsUseCase(
      repositories.notifications
    ),
  });

  const healthController = new HealthController(
    new CheckReadinessUseCase(
      infrastructure.probes,
      env.READINESS_TIMEOUT_MILLISECONDS
    )
  );

  return {
    idGenerator,
    tokenService,
    userController,
    authController,
    organizationController,
    membershipController,
    activityController,
    healthController,
  };
};
