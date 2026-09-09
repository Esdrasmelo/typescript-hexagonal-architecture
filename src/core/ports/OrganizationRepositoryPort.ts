import { MembershipEntity, OrganizationEntity, Slug } from "../entities";

export interface IOrganizationRepositoryPort {
  findById(organizationId: string): Promise<OrganizationEntity | null>;
  findBySlug(slug: Slug): Promise<OrganizationEntity | null>;
  findAllForMember(userId: string): Promise<OrganizationEntity[]>;
  createWithOwner(
    organization: OrganizationEntity,
    owner: MembershipEntity
  ): Promise<OrganizationEntity>;
  update(organization: OrganizationEntity): Promise<OrganizationEntity>;
}
