import { LoginUseCase, LogoutUseCase } from "../../../../../core/use-cases";
import { IUserResponse, toUserResponse } from "../presenters/userPresenter";
import {
  HttpResult,
  IActorContext,
  ISessionContext,
  noContent,
  ok,
} from "../protocols";
import { loginSchema } from "../schemas";

export interface ILoginResponse {
  token: string;
  expires_at: string;
  user: IUserResponse;
}

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase
  ) {}

  public async Login(
    body: unknown,
    context: Pick<IActorContext, "requestId">
  ): Promise<HttpResult<ILoginResponse>> {
    const credentials = loginSchema.parse(body);

    const { token, expiresAt, user } = await this.loginUseCase.Execute({
      ...credentials,
      requestId: context.requestId,
    });

    return ok({
      token,
      expires_at: expiresAt.toISOString(),
      user: toUserResponse(user),
    });
  }

  public async Logout(session: ISessionContext): Promise<HttpResult<null>> {
    await this.logoutUseCase.Execute({
      actorId: session.actorId,
      tokenId: session.tokenId,
      expiresAt: session.expiresAt,
      requestId: session.requestId,
    });

    return noContent();
  }
}
