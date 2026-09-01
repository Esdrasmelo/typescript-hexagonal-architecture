import { Email, UserEntity } from "../../../../core/entities";
import { IUserRepositoryPort } from "../../../../core/ports";
import { prismaClient } from "./prismaClient";

interface IUserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export class UserPrismaRepository implements IUserRepositoryPort {
  constructor(private readonly client = prismaClient) {}

  public async findAll(): Promise<UserEntity[]> {
    const rows = await this.client.users.findMany({
      orderBy: { created_at: "asc" },
    });

    return rows.map(UserPrismaRepository.ToEntity);
  }

  public async findByEmail(email: Email): Promise<UserEntity | null> {
    const row = await this.client.users.findUnique({
      where: { email: email.Value },
    });

    return row ? UserPrismaRepository.ToEntity(row) : null;
  }

  public async create(user: UserEntity): Promise<UserEntity> {
    const row = await this.client.users.create({
      data: {
        id: user.Id,
        name: user.Name,
        email: user.Email.Value,
        password: user.PasswordHash,
        created_at: user.CreatedAt,
        updated_at: user.UpdatedAt,
      },
    });

    return UserPrismaRepository.ToEntity(row);
  }

  private static ToEntity(row: IUserRow): UserEntity {
    return UserEntity.Restore({
      id: row.id,
      name: row.name,
      email: Email.Create(row.email),
      passwordHash: row.password,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
