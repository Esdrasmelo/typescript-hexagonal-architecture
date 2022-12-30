import { HttpResponse, okResponse } from "../../../core/protocols";
import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
  IUserRepositoryPortOut,
} from "../../../core";
import { IUserControllerDataIn } from "./in/UserControllerDataIn";
import { IUserUseCasesInterface } from "../../../core/use-cases/interfaces";
import { excludeFields } from "../../../utils";

export class UserController {
  private createUserUseCase: CreateUserUseCase;
  private findAllUsersUseCase: FindAllUsersUseCase;
  private findUserByEmailUseCase: FindUserByEmailUseCase;

  constructor(useCases: IUserUseCasesInterface) {
    this.createUserUseCase = useCases.createUserUseCase;
    this.findAllUsersUseCase = useCases.findAllUsersUseCase;
    this.findUserByEmailUseCase = useCases.findUserByEmailUseCase;
  }

  async CreateUser(userData: IUserControllerDataIn): Promise<HttpResponse> {
    const user = await this.createUserUseCase.Execute(userData);

    return user;
  }

  async GetUsers(): Promise<HttpResponse> {
    let users = await this.findAllUsersUseCase.Execute();

    if (users.statusCode === 200) {
      users.body = excludeFields(users.body, ["password"]);
    }

    return users;
  }

  async GetUserByEmail(email: string): Promise<HttpResponse> {
    let user = await this.findUserByEmailUseCase.Execute(email);

    if (user.statusCode === 200) {
      user.body = excludeFields(user.body, ["password"]);
    }

    return user;
  }
}
