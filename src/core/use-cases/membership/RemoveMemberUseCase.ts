import { MembershipEntity, MembershipRole } from "../../entities";
import {
  ForbiddenAction,
  OrganizationNeedsAnOwner,
  ResourceNotFound,
} from "../../exceptions";
import { IEventRecorderPort, IMembershipRepositoryPort } from "../../ports";
import { OrganizationAccess, OrganizationCache } from "../../services";
import { IUseCase } from "../UseCase";

export interface IRemoveMemberInput {
  slug: unknown;
  userId: string;
  actorId: string;
  requestId?: string | null;
}

const ACTION = "remover membros desta organização";

export class RemoveMemberUseCase implements IUseCase<IRemoveMemberInput, void> {
  constructor(
    private readonly organizationAccess: OrganizationAccess,
    private readonly membershipRepository: IMembershipRepositoryPort,
    private readonly organizationCache: OrganizationCache,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(input: IRemoveMemberInput): Promise<void> {
    const { organization, membership: actorMembership } =
      await this.organizationAccess.ResolveForManagement(
        input.slug,
        input.actorId,
        ACTION
      );

    const target = await this.FindMember(organization.Id, input.userId);

    if (!actorMembership.Role.OutranksOrEquals(target.Role)) {
      throw new ForbiddenAction("remover este membro");
    }

    if (target.Role.IsOwner) {
      await this.EnsureAnotherOwnerRemains(organization.Id);
    }

    await this.membershipRepository.delete(target.Id);
    await this.organizationCache.InvalidateUser(target.UserId);

    await this.eventRecorder.record({
      name: "membership.revoked",
      resource: { type: "membership", id: target.Id },
      actorId: input.actorId,
      organizationId: organization.Id,
      requestId: input.requestId,
      metadata: {
        userId: target.UserId,
        role: target.Role.Value,
        organization: organization.Name,
      },
    });
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
