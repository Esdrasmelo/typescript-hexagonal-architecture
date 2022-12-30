import { excludeFields } from "../../../utils";
import { ResourceNotFound } from "../../exceptions";
import { IUserRepositoryPort, IUserRepositoryPortOut } from "../../ports";
import {
  HttpResponse,
  notFoundResponse,
  okResponse,
} from "../../protocols/http-response";
import { IUseCase } from "../UseCase";

export class FindUserByEmailUseCase implements IUseCase {
  private userRepository: IUserRepositoryPort;

  constructor(userRepository: IUserRepositoryPort) {
    this.userRepository = userRepository;
  }

  async Execute(email: string): Promise<HttpResponse> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) return notFoundResponse(new ResourceNotFound("User"));

    return okResponse(user);
  }
}
