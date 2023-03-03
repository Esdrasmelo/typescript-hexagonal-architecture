import { ResourceNotFound } from "../../exceptions";
import { IUserRepositoryPort } from "../../ports";
import {
  HttpResponse,
  notFoundResponse,
  okResponse,
} from "../../protocols/http-response";
import { IUseCase } from "../UseCase";

export class FindAllUsersUseCase implements IUseCase {
  private userRepository: IUserRepositoryPort;

  constructor(userRepository: IUserRepositoryPort) {
    this.userRepository = userRepository;
  }

  async Execute(): Promise<HttpResponse> {
    const users = await this.userRepository.findAll();

    if (!users.length) return notFoundResponse(new ResourceNotFound("Users"));

    return okResponse(users);
  }
}
