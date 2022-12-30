import {
  HttpResponse,
  badRequestResponse,
  createdResponse,
  okResponse,
} from "../../protocols/http-response";
import { IUseCase } from "../UseCase";
import { IUserPayloadIn } from "../in/UserPayloadIn";
import { IUserRepositoryPort } from "../../ports";
import { UserEntity } from "../../entities";
import {
  DataAlreadyExists,
  ResourceWasNotAbleToBeCreated,
} from "../../exceptions";

export class CreateUserUseCase implements IUseCase {
  private userRepository: IUserRepositoryPort;

  constructor(userRepository: IUserRepositoryPort) {
    this.userRepository = userRepository;
  }

  async Execute(userPayloadIn: IUserPayloadIn): Promise<HttpResponse> {
    const { CreateUser, GetEmail } = new UserEntity(userPayloadIn);
    const userAlreadyExists = await this.userRepository.findByEmail(GetEmail);

    if (userAlreadyExists) throw new DataAlreadyExists("User");

    const user = CreateUser(userPayloadIn);
    const createNewUserOnDB = await this.userRepository.create(user);

    if (createNewUserOnDB)
      return createdResponse({
        body: createNewUserOnDB,
      });

    return badRequestResponse(new ResourceWasNotAbleToBeCreated("User"));
  }
}
