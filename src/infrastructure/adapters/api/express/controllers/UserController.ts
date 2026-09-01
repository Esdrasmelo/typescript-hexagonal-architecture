import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
} from "../../../../../core/use-cases";
import { IUserResponse, toUserResponse, toUserResponseList } from "../presenters/userPresenter";
import { HttpResult, created, ok } from "../protocols";
import { createUserSchema, listUsersQuerySchema } from "../schemas";

export interface IUserUseCases {
  createUserUseCase: CreateUserUseCase;
  findAllUsersUseCase: FindAllUsersUseCase;
  findUserByEmailUseCase: FindUserByEmailUseCase;
}

export class UserController {
  constructor(private readonly useCases: IUserUseCases) {}

  public async CreateUser(body: unknown): Promise<HttpResult<IUserResponse>> {
    const input = createUserSchema.parse(body);
    const user = await this.useCases.createUserUseCase.Execute(input);

    return created(toUserResponse(user));
  }

  public async GetUsers(
    query: unknown
  ): Promise<HttpResult<IUserResponse | IUserResponse[]>> {
    const { email } = listUsersQuerySchema.parse(query);

    if (email) {
      const user = await this.useCases.findUserByEmailUseCase.Execute(email);

      return ok(toUserResponse(user));
    }

    const users = await this.useCases.findAllUsersUseCase.Execute();

    return ok(toUserResponseList(users));
  }
}
