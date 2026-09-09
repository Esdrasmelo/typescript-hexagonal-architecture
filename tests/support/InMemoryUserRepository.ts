import { Email, UserEntity } from "../../src/core/entities";
import { IUserRepositoryPort } from "../../src/core/ports";

export class InMemoryUserRepository implements IUserRepositoryPort {
  private readonly users = new Map<string, UserEntity>();

  public async findAll(): Promise<UserEntity[]> {
    return [...this.users.values()].sort(
      (first, second) => first.CreatedAt.getTime() - second.CreatedAt.getTime()
    );
  }

  public async findById(userId: string): Promise<UserEntity | null> {
    return this.users.get(userId) ?? null;
  }

  public async findManyByIds(
    userIds: readonly string[]
  ): Promise<UserEntity[]> {
    return userIds.flatMap((userId) => {
      const user = this.users.get(userId);

      return user ? [user] : [];
    });
  }

  public async findByEmail(email: Email): Promise<UserEntity | null> {
    return (
      [...this.users.values()].find((user) => user.Email.Equals(email)) ?? null
    );
  }

  public async create(user: UserEntity): Promise<UserEntity> {
    this.users.set(user.Id, user);

    return user;
  }
}
