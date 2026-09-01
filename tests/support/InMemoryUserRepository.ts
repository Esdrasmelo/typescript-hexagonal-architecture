import { Email, UserEntity } from "../../src/core/entities";
import { IUserRepositoryPort } from "../../src/core/ports";

export class InMemoryUserRepository implements IUserRepositoryPort {
  private readonly users = new Map<string, UserEntity>();

  public async findAll(): Promise<UserEntity[]> {
    return [...this.users.values()].sort(
      (a, b) => a.CreatedAt.getTime() - b.CreatedAt.getTime()
    );
  }

  public async findByEmail(email: Email): Promise<UserEntity | null> {
    return this.users.get(email.Value) ?? null;
  }

  public async create(user: UserEntity): Promise<UserEntity> {
    this.users.set(user.Email.Value, user);

    return user;
  }
}
