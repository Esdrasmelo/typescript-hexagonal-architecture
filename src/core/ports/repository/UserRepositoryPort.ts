import { UserEntity } from "../../entities";
import { IFindUserPasswordParamsIn } from "../../use-cases";
import { IUserRepositoryPortOut, IUserRepositoryPortIn } from "./";

export interface IUserRepositoryPort {
  findAll: () => Promise<IUserRepositoryPortOut[]>;
  create: (userData: UserEntity) => Promise<IUserRepositoryPortOut>;
  findByEmail: (email: string) => Promise<IUserRepositoryPortOut | null>;
}
