import { LoginUseCase } from "../../../../../core/use-cases";
import { IUserResponse, toUserResponse } from "../presenters/userPresenter";
import { HttpResult, ok } from "../protocols";
import { loginSchema } from "../schemas";

export interface ILoginResponse {
  token: string;
  user: IUserResponse;
}

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  public async Login(body: unknown): Promise<HttpResult<ILoginResponse>> {
    const credentials = loginSchema.parse(body);
    const { token, user } = await this.loginUseCase.Execute(credentials);

    return ok({ token, user: toUserResponse(user) });
  }
}
