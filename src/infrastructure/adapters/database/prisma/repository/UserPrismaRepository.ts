import { IFindUserPasswordParamsIn } from "../../../../../core";
import { UserEntity } from "../../../../../core/entities";
import {
  IUserRepositoryPort,
  IUserRepositoryPortOut,
} from "../../../../../core/ports/repository";
import { prismaClient } from "../prismaConnection";

export class UserPrismaRepository implements IUserRepositoryPort {
  async findAll(): Promise<IUserRepositoryPortOut[]> {
    return prismaClient.users.findMany();
  }

  async create(userData: UserEntity): Promise<IUserRepositoryPortOut> {
    return prismaClient.users.create({
      data: userData.GetAllProperties(),
    });
  }

  async findByEmail(email: string): Promise<IUserRepositoryPortOut | null> {
    return prismaClient.users.findFirst({
      where: {
        email,
      },
    });
  }

  async findPasswordUsingParams(
    searchParams: IFindUserPasswordParamsIn
  ): Promise<Pick<IUserRepositoryPortOut, "password"> | null> {
    return prismaClient.users.findUnique({
      where: searchParams,
      select: {
        password: true,
      },
    });
  }
}
