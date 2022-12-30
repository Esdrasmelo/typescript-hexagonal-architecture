import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
} from "../..";

export interface IUserUseCasesInterface {
  createUserUseCase: CreateUserUseCase;
  findAllUsersUseCase: FindAllUsersUseCase;
  findUserByEmailUseCase: FindUserByEmailUseCase;
}
