import { Email, UserEntity } from "../entities";

export interface IUserRepositoryPort {
  findAll(): Promise<UserEntity[]>;
  findById(userId: string): Promise<UserEntity | null>;
  findManyByIds(userIds: readonly string[]): Promise<UserEntity[]>;
  findByEmail(email: Email): Promise<UserEntity | null>;
  create(user: UserEntity): Promise<UserEntity>;
}
