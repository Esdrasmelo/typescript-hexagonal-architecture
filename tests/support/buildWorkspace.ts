import { UserEntity } from "../../src/core/entities";
import { EventRecorder } from "../../src/core/events";
import { OrganizationAccess, OrganizationCache } from "../../src/core/services";
import {
  AddMemberUseCase,
  ChangeMemberRoleUseCase,
  CreateOrganizationUseCase,
  CreateUserUseCase,
  GetOrganizationUseCase,
  ListAuditEventsUseCase,
  ListMembersUseCase,
  ListUserOrganizationsUseCase,
  RemoveMemberUseCase,
  RenameOrganizationUseCase,
} from "../../src/core/use-cases";
import {
  InMemoryAuditEventRepository,
  InMemoryNotificationRepository,
} from "./InMemoryDocumentStores";
import { InMemoryMembershipRepository } from "./InMemoryMembershipRepository";
import { InMemoryOrganizationRepository } from "./InMemoryOrganizationRepository";
import { InMemoryUserRepository } from "./InMemoryUserRepository";
import {
  FakePasswordHasher,
  FixedClock,
  InMemoryCache,
  RecordingEventPublisher,
  SequentialIdGenerator,
  SilentLogger,
} from "./fakes";

const CACHE_TTL_IN_SECONDS = 60;

export interface IWorkspace {
  users: InMemoryUserRepository;
  organizations: InMemoryOrganizationRepository;
  memberships: InMemoryMembershipRepository;
  auditEvents: InMemoryAuditEventRepository;
  notifications: InMemoryNotificationRepository;
  cache: InMemoryCache;
  publisher: RecordingEventPublisher;
  createUser: (name: string, email: string) => Promise<UserEntity>;
  createOrganization: CreateOrganizationUseCase;
  listOrganizations: ListUserOrganizationsUseCase;
  getOrganization: GetOrganizationUseCase;
  renameOrganization: RenameOrganizationUseCase;
  addMember: AddMemberUseCase;
  listMembers: ListMembersUseCase;
  changeMemberRole: ChangeMemberRoleUseCase;
  removeMember: RemoveMemberUseCase;
  listAuditEvents: ListAuditEventsUseCase;
}

export const buildWorkspace = (): IWorkspace => {
  const idGenerator = new SequentialIdGenerator();
  const clock = new FixedClock();
  const logger = new SilentLogger();

  const memberships = new InMemoryMembershipRepository();
  const organizations = new InMemoryOrganizationRepository(memberships);
  const users = new InMemoryUserRepository();
  const auditEvents = new InMemoryAuditEventRepository();
  const notifications = new InMemoryNotificationRepository();
  const cache = new InMemoryCache();
  const publisher = new RecordingEventPublisher();

  const eventRecorder = new EventRecorder(
    publisher,
    new SequentialIdGenerator(),
    clock,
    logger
  );

  const organizationAccess = new OrganizationAccess(organizations, memberships);
  const organizationCache = new OrganizationCache(
    cache,
    memberships,
    CACHE_TTL_IN_SECONDS
  );

  const createUserUseCase = new CreateUserUseCase(
    users,
    new FakePasswordHasher(),
    idGenerator,
    clock,
    eventRecorder
  );

  return {
    users,
    organizations,
    memberships,
    auditEvents,
    notifications,
    cache,
    publisher,
    createUser: (name: string, email: string): Promise<UserEntity> =>
      createUserUseCase.Execute({ name, email, password: "senha-forte-123" }),
    createOrganization: new CreateOrganizationUseCase(
      organizations,
      organizationCache,
      idGenerator,
      clock,
      eventRecorder
    ),
    listOrganizations: new ListUserOrganizationsUseCase(
      organizations,
      organizationCache
    ),
    getOrganization: new GetOrganizationUseCase(organizationAccess),
    renameOrganization: new RenameOrganizationUseCase(
      organizationAccess,
      organizations,
      organizationCache,
      clock,
      eventRecorder
    ),
    addMember: new AddMemberUseCase(
      organizationAccess,
      memberships,
      users,
      organizationCache,
      idGenerator,
      clock,
      eventRecorder
    ),
    listMembers: new ListMembersUseCase(
      organizationAccess,
      memberships,
      users
    ),
    changeMemberRole: new ChangeMemberRoleUseCase(
      organizationAccess,
      memberships,
      clock,
      eventRecorder
    ),
    removeMember: new RemoveMemberUseCase(
      organizationAccess,
      memberships,
      organizationCache,
      eventRecorder
    ),
    listAuditEvents: new ListAuditEventsUseCase(
      organizationAccess,
      auditEvents
    ),
  };
};
