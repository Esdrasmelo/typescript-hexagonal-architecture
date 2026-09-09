import {
  MembershipEntity,
  MembershipRole,
  MembershipRoleName,
} from "../../../../core/entities";
import { IMembershipRepositoryPort } from "../../../../core/ports";
import { prismaClient } from "./prismaClient";

interface IMembershipRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: MembershipRoleName;
  invited_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export const toMembershipRow = (
  membership: MembershipEntity
): IMembershipRow => ({
  id: membership.Id,
  organization_id: membership.OrganizationId,
  user_id: membership.UserId,
  role: membership.Role.Value,
  invited_by: membership.InvitedBy,
  created_at: membership.CreatedAt,
  updated_at: membership.UpdatedAt,
});

export class MembershipPrismaRepository implements IMembershipRepositoryPort {
  constructor(private readonly client = prismaClient) {}

  public async findByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<MembershipEntity | null> {
    const row = await this.client.memberships.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: organizationId,
          user_id: userId,
        },
      },
    });

    return row ? MembershipPrismaRepository.ToEntity(row) : null;
  }

  public async findByOrganization(
    organizationId: string
  ): Promise<MembershipEntity[]> {
    const rows = await this.client.memberships.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: "asc" },
    });

    return rows.map(MembershipPrismaRepository.ToEntity);
  }

  public async countByRole(
    organizationId: string,
    role: MembershipRole
  ): Promise<number> {
    return this.client.memberships.count({
      where: { organization_id: organizationId, role: role.Value },
    });
  }

  public async create(
    membership: MembershipEntity
  ): Promise<MembershipEntity> {
    const row = await this.client.memberships.create({
      data: toMembershipRow(membership),
    });

    return MembershipPrismaRepository.ToEntity(row);
  }

  public async update(
    membership: MembershipEntity
  ): Promise<MembershipEntity> {
    const row = await this.client.memberships.update({
      where: { id: membership.Id },
      data: {
        role: membership.Role.Value,
        updated_at: membership.UpdatedAt,
      },
    });

    return MembershipPrismaRepository.ToEntity(row);
  }

  public async delete(membershipId: string): Promise<void> {
    await this.client.memberships.delete({ where: { id: membershipId } });
  }

  private static ToEntity(row: IMembershipRow): MembershipEntity {
    return MembershipEntity.Restore({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      role: MembershipRole.Create(row.role),
      invitedBy: row.invited_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
