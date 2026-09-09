import { MembershipEntity, MembershipRole } from "../entities";

export interface IMembershipRepositoryPort {
  findByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<MembershipEntity | null>;
  findByOrganization(organizationId: string): Promise<MembershipEntity[]>;
  countByRole(organizationId: string, role: MembershipRole): Promise<number>;
  create(membership: MembershipEntity): Promise<MembershipEntity>;
  update(membership: MembershipEntity): Promise<MembershipEntity>;
  delete(membershipId: string): Promise<void>;
}
