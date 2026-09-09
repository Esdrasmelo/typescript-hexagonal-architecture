import {
  Email,
  MembershipEntity,
  MembershipRole,
  UserEntity,
} from "../../entities";
import {
  DataAlreadyExists,
  ForbiddenAction,
  ResourceNotFound,
} from "../../exceptions";
import {
  IClockPort,
  IEventRecorderPort,
  IIdGeneratorPort,
  IMembershipRepositoryPort,
  IUserRepositoryPort,
} from "../../ports";
import { OrganizationAccess, OrganizationCache } from "../../services";
import { IUseCase } from "../UseCase";

export interface IAddMemberInput {
  slug: unknown;
  email: unknown;
  role?: unknown;
  actorId: string;
  requestId?: string | null;
}

export interface IMemberView {
  membership: MembershipEntity;
  user: UserEntity;
}

const ACTION = "gerenciar membros desta organização";

export class AddMemberUseCase implements IUseCase<IAddMemberInput, IMemberView> {
  constructor(
    private readonly organizationAccess: OrganizationAccess,
    private readonly membershipRepository: IMembershipRepositoryPort,
    private readonly userRepository: IUserRepositoryPort,
    private readonly organizationCache: OrganizationCache,
    private readonly idGenerator: IIdGeneratorPort,
    private readonly clock: IClockPort,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(input: IAddMemberInput): Promise<IMemberView> {
    const { organization, membership: actorMembership } =
      await this.organizationAccess.ResolveForManagement(
        input.slug,
        input.actorId,
        ACTION
      );

    const role = this.ReadRole(input.role);

    if (!actorMembership.Role.OutranksOrEquals(role)) {
      throw new ForbiddenAction("conceder um papel acima do seu");
    }

    const user = await this.FindUser(input.email);

    await this.EnsureIsNotMemberYet(organization.Id, user.Id);

    const membership = await this.membershipRepository.create(
      MembershipEntity.Create({
        id: this.idGenerator.generate(),
        organizationId: organization.Id,
        userId: user.Id,
        role,
        invitedBy: input.actorId,
        now: this.clock.now(),
      })
    );

    await this.organizationCache.InvalidateUser(user.Id);

    await this.eventRecorder.record({
      name: "membership.granted",
      resource: { type: "membership", id: membership.Id },
      actorId: input.actorId,
      organizationId: organization.Id,
      requestId: input.requestId,
      metadata: {
        userId: user.Id,
        organization: organization.Name,
        organizationSlug: organization.Slug.Value,
        role: role.Value,
      },
    });

    return { membership, user };
  }

  private ReadRole(role: unknown): MembershipRole {
    return role === undefined || role === null
      ? MembershipRole.Member
      : MembershipRole.Create(role);
  }

  private async FindUser(email: unknown): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(Email.Create(email));

    if (!user) throw new ResourceNotFound("Usuário");

    return user;
  }

  private async EnsureIsNotMemberYet(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const existing = await this.membershipRepository.findByOrganizationAndUser(
      organizationId,
      userId
    );

    if (existing) throw new DataAlreadyExists("Membro");
  }
}
