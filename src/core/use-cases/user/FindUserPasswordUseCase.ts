import { IFindUserPasswordParamsIn, IUseCase } from "..";
import { ResourceNotFound } from "../../exceptions";
import { IUserRepositoryPort } from "../../ports";
import { HttpResponse, notFoundResponse, okResponse } from "../../protocols";

export class FindUserPasswordUseCase implements IUseCase {
  private userRepository: IUserRepositoryPort;

  constructor(userRepository: IUserRepositoryPort) {
    this.userRepository = userRepository;
  }

  async Execute(
    searchParams: IFindUserPasswordParamsIn
  ): Promise<HttpResponse> {
    const user = await this.userRepository.findPasswordUsingParams(
      searchParams
    );

    if (!user) return notFoundResponse(new ResourceNotFound("User"));

    const { password } = user;

    return okResponse(password);
  }
}
