import { MembershipEntity, OrganizationEntity, Slug } from "../entities";
import { ForbiddenAction, ResourceNotFound } from "../exceptions";
import {
  IMembershipRepositoryPort,
  IOrganizationRepositoryPort,
} from "../ports";

export interface IOrganizationAccess {
  organization: OrganizationEntity;
  membership: MembershipEntity;
}

export class OrganizationAccess {
  constructor(
    private readonly organizationRepository: IOrganizationRepositoryPort,
    private readonly membershipRepository: IMembershipRepositoryPort
  ) {}

  public async Resolve(
    slug: unknown,
    actorId: string
  ): Promise<IOrganizationAccess> {
    const organization = await this.organizationRepository.findBySlug(
      Slug.Create(slug)
    );

    if (!organization) throw new ResourceNotFound("Organização");

    const membership =
      await this.membershipRepository.findByOrganizationAndUser(
        organization.Id,
        actorId
      );

    if (!membership) throw new ResourceNotFound("Organização");

    return { organization, membership };
  }

  public async ResolveForManagement(
    slug: unknown,
    actorId: string,
    action: string
  ): Promise<IOrganizationAccess> {
    const access = await this.Resolve(slug, actorId);

    if (!access.membership.Role.CanManageMembers) {
      throw new ForbiddenAction(action);
    }

    return access;
  }
}
