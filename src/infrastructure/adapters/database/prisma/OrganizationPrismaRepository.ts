import {
  MembershipEntity,
  OrganizationEntity,
  Slug,
} from "../../../../core/entities";
import { IOrganizationRepositoryPort } from "../../../../core/ports";
import { toMembershipRow } from "./MembershipPrismaRepository";
import { prismaClient } from "./prismaClient";

interface IOrganizationRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export class OrganizationPrismaRepository
  implements IOrganizationRepositoryPort
{
  constructor(private readonly client = prismaClient) {}

  public async findById(
    organizationId: string
  ): Promise<OrganizationEntity | null> {
    const row = await this.client.organizations.findUnique({
      where: { id: organizationId },
    });

    return row ? OrganizationPrismaRepository.ToEntity(row) : null;
  }

  public async findBySlug(slug: Slug): Promise<OrganizationEntity | null> {
    const row = await this.client.organizations.findUnique({
      where: { slug: slug.Value },
    });

    return row ? OrganizationPrismaRepository.ToEntity(row) : null;
  }

  public async findAllForMember(
    userId: string
  ): Promise<OrganizationEntity[]> {
    const rows = await this.client.organizations.findMany({
      where: { members: { some: { user_id: userId } } },
      orderBy: { created_at: "asc" },
    });

    return rows.map(OrganizationPrismaRepository.ToEntity);
  }

  public async createWithOwner(
    organization: OrganizationEntity,
    owner: MembershipEntity
  ): Promise<OrganizationEntity> {
    const [row] = await this.client.$transaction([
      this.client.organizations.create({
        data: OrganizationPrismaRepository.ToRow(organization),
      }),
      this.client.memberships.create({ data: toMembershipRow(owner) }),
    ]);

    return OrganizationPrismaRepository.ToEntity(row);
  }

  public async update(
    organization: OrganizationEntity
  ): Promise<OrganizationEntity> {
    const row = await this.client.organizations.update({
      where: { id: organization.Id },
      data: {
        name: organization.Name,
        slug: organization.Slug.Value,
        updated_at: organization.UpdatedAt,
      },
    });

    return OrganizationPrismaRepository.ToEntity(row);
  }

  private static ToRow(organization: OrganizationEntity): IOrganizationRow {
    return {
      id: organization.Id,
      name: organization.Name,
      slug: organization.Slug.Value,
      owner_id: organization.OwnerId,
      created_at: organization.CreatedAt,
      updated_at: organization.UpdatedAt,
    };
  }

  private static ToEntity(row: IOrganizationRow): OrganizationEntity {
    return OrganizationEntity.Restore({
      id: row.id,
      name: row.name,
      slug: Slug.Create(row.slug),
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
