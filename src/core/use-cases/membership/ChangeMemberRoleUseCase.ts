import { MembershipEntity, MembershipRole } from "../../entities";
import {
  ForbiddenAction,
  OrganizationNeedsAnOwner,
  ResourceNotFound,
} from "../../exceptions";
import {
  IClockPort,
  IEventRecorderPort,
  IMembershipRepositoryPort,
} from "../../ports";
import { OrganizationAccess } from "../../services";
import { IUseCase } from "../UseCase";

export interface IChangeMemberRoleInput {
  slug: unknown;
  userId: string;
  role: unknown;
  actorId: string;
  requestId?: string | null;
}

const ACTION = "alterar papéis nesta organização";

export class ChangeMemberRoleUseCase
  implements IUseCase<IChangeMemberRoleInput, MembershipEntity>
{
  constructor(
    private readonly organizationAccess: OrganizationAccess,
    private readonly membershipRepository: IMembershipRepositoryPort,
    private readonly clock: IClockPort,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(
    input: IChangeMemberRoleInput
  ): Promise<MembershipEntity> {
    const { organization, membership: actorMembership } =
      await this.organizationAccess.ResolveForManagement(
        input.slug,
        input.actorId,
        ACTION
      );

    const target = await this.FindMember(organization.Id, input.userId);
    const role = MembershipRole.Create(input.role);

    this.EnsureActorOutranksBothRoles(actorMembership.Role, target.Role, role);

    if (target.Role.Equals(role)) return target;

    if (target.Role.IsOwner) {
      await this.EnsureAnotherOwnerRemains(organization.Id);
    }

    const updated = await this.membershipRepository.update(
      target.ChangeRole(role, this.clock.now())
    );

    await this.eventRecorder.record({
      name: "membership.role-changed",
      resource: { type: "membership", id: updated.Id },
      actorId: input.actorId,
      organizationId: organization.Id,
      requestId: input.requestId,
      metadata: {
        userId: updated.UserId,
        from: target.Role.Value,
        to: updated.Role.Value,
        organization: organization.Name,
      },
    });

    return updated;
  }

  private async FindMember(
    organizationId: string,
    userId: string
  ): Promise<MembershipEntity> {
    const member = await this.membershipRepository.findByOrganizationAndUser(
      organizationId,
      userId
    );

    if (!member) throw new ResourceNotFound("Membro");

    return member;
  }

  private EnsureActorOutranksBothRoles(
    actorRole: MembershipRole,
    currentRole: MembershipRole,
    desiredRole: MembershipRole
  ): void {
    if (
      !actorRole.OutranksOrEquals(currentRole) ||
      !actorRole.OutranksOrEquals(desiredRole)
    ) {
      throw new ForbiddenAction("alterar o papel deste membro");
    }
  }

  private async EnsureAnotherOwnerRemains(
    organizationId: string
  ): Promise<void> {
    const owners = await this.membershipRepository.countByRole(
      organizationId,
      MembershipRole.Owner
    );

    if (owners <= 1) throw new OrganizationNeedsAnOwner();
  }
}
