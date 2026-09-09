import {
  MembershipEntity,
  OrganizationEntity,
  Slug,
} from "../../src/core/entities";
import { IOrganizationRepositoryPort } from "../../src/core/ports";
import { InMemoryMembershipRepository } from "./InMemoryMembershipRepository";

export class InMemoryOrganizationRepository
  implements IOrganizationRepositoryPort
{
  private readonly organizations = new Map<string, OrganizationEntity>();

  constructor(private readonly memberships: InMemoryMembershipRepository) {}

  public async findById(
    organizationId: string
  ): Promise<OrganizationEntity | null> {
    return this.organizations.get(organizationId) ?? null;
  }

  public async findBySlug(slug: Slug): Promise<OrganizationEntity | null> {
    return (
      [...this.organizations.values()].find((organization) =>
        organization.Slug.Equals(slug)
      ) ?? null
    );
  }

  public async findAllForMember(
    userId: string
  ): Promise<OrganizationEntity[]> {
    const organizationIds = new Set(
      (await this.memberships.findByUser(userId)).map(
        (membership) => membership.OrganizationId
      )
    );

    return [...this.organizations.values()]
      .filter((organization) => organizationIds.has(organization.Id))
      .sort(
        (first, second) =>
          first.CreatedAt.getTime() - second.CreatedAt.getTime()
      );
  }

  public async createWithOwner(
    organization: OrganizationEntity,
    owner: MembershipEntity
  ): Promise<OrganizationEntity> {
    this.organizations.set(organization.Id, organization);
    await this.memberships.create(owner);

    return organization;
  }

  public async update(
    organization: OrganizationEntity
  ): Promise<OrganizationEntity> {
    this.organizations.set(organization.Id, organization);

    return organization;
  }
}
