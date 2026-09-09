import { IOrganizationSnapshot, OrganizationEntity } from "../entities";
import { ICachePort, IMembershipRepositoryPort } from "../ports";

const keyFor = (userId: string): string => `organizations:user:${userId}`;

export class OrganizationCache {
  constructor(
    private readonly cache: ICachePort,
    private readonly membershipRepository: IMembershipRepositoryPort,
    private readonly ttlInSeconds: number
  ) {}

  public async Read(userId: string): Promise<OrganizationEntity[] | null> {
    const cached = await this.cache.get<IOrganizationSnapshot[]>(
      keyFor(userId)
    );

    return cached ? cached.map(OrganizationEntity.FromSnapshot) : null;
  }

  public async Write(
    userId: string,
    organizations: readonly OrganizationEntity[]
  ): Promise<void> {
    await this.cache.set(
      keyFor(userId),
      organizations.map((organization) => organization.Snapshot()),
      this.ttlInSeconds
    );
  }

  public async InvalidateUser(userId: string): Promise<void> {
    await this.cache.delete(keyFor(userId));
  }

  public async InvalidateOrganization(organizationId: string): Promise<void> {
    const members = await this.membershipRepository.findByOrganization(
      organizationId
    );

    await Promise.all(
      members.map((member) => this.InvalidateUser(member.UserId))
    );
  }
}
