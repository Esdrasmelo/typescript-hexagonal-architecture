import { MembershipEntity, MembershipRole } from "../../src/core/entities";
import { IMembershipRepositoryPort } from "../../src/core/ports";

export class InMemoryMembershipRepository implements IMembershipRepositoryPort {
  private readonly memberships = new Map<string, MembershipEntity>();

  public async findByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<MembershipEntity | null> {
    return (
      [...this.memberships.values()].find(
        (membership) =>
          membership.OrganizationId === organizationId &&
          membership.UserId === userId
      ) ?? null
    );
  }

  public async findByOrganization(
    organizationId: string
  ): Promise<MembershipEntity[]> {
    return [...this.memberships.values()]
      .filter((membership) => membership.OrganizationId === organizationId)
      .sort(
        (first, second) =>
          first.CreatedAt.getTime() - second.CreatedAt.getTime()
      );
  }

  public async findByUser(userId: string): Promise<MembershipEntity[]> {
    return [...this.memberships.values()].filter(
      (membership) => membership.UserId === userId
    );
  }

  public async countByRole(
    organizationId: string,
    role: MembershipRole
  ): Promise<number> {
    return (await this.findByOrganization(organizationId)).filter(
      (membership) => membership.Role.Equals(role)
    ).length;
  }

  public async create(
    membership: MembershipEntity
  ): Promise<MembershipEntity> {
    this.memberships.set(membership.Id, membership);

    return membership;
  }

  public async update(
    membership: MembershipEntity
  ): Promise<MembershipEntity> {
    this.memberships.set(membership.Id, membership);

    return membership;
  }

  public async delete(membershipId: string): Promise<void> {
    this.memberships.delete(membershipId);
  }
}
