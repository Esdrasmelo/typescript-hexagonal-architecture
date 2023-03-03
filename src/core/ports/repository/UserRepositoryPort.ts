import { UserEntity } from "../../entities";
import { IUserRepositoryPortOut } from "./";

export interface IUserRepositoryPort {
  findAll: () => Promise<IUserRepositoryPortOut[]>;
  create: (userData: UserEntity) => Promise<IUserRepositoryPortOut>;
  findByEmail: (email: string) => Promise<IUserRepositoryPortOut | null>;
}