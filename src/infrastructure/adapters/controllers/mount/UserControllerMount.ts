import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
} from "../../../../core";
import { UserController } from "../UserController";
import { IUserUseCasesInterface } from "../../../../core/use-cases/interfaces";
import { UserPrismaRepository } from "../../database/prisma/repository";

export const userControllerMount = (): UserController => {
  const userPrismaRepository = new UserPrismaRepository();
  const createUserUseCase = new CreateUserUseCase(userPrismaRepository);
  const findAllUsersUseCase = new FindAllUsersUseCase(userPrismaRepository);
  const findUserByEmailUseCase = new FindUserByEmailUseCase(
    userPrismaRepository
  );
  const useCases: IUserUseCasesInterface = {
    createUserUseCase,
    findAllUsersUseCase,
    findUserByEmailUseCase,
  };

  const userController = new UserController(useCases);

  return userController;
};
