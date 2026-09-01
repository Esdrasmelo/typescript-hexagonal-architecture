import { Email, UserEntity } from "../entities";

export interface IUserRepositoryPort {
  findAll(): Promise<UserEntity[]>;
  findByEmail(email: Email): Promise<UserEntity | null>;
  create(user: UserEntity): Promise<UserEntity>;
}
