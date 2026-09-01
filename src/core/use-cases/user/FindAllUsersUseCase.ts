import { UserEntity } from "../../entities";
import { IUserRepositoryPort } from "../../ports";
import { IUseCaseWithoutInput } from "../UseCase";

export class FindAllUsersUseCase implements IUseCaseWithoutInput<UserEntity[]> {
  constructor(private readonly userRepository: IUserRepositoryPort) {}

  public async Execute(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }
}
