import { Email, UserEntity } from "../../entities";
import { ResourceNotFound } from "../../exceptions";
import { IUserRepositoryPort } from "../../ports";
import { IUseCase } from "../UseCase";

export class FindUserByEmailUseCase implements IUseCase<unknown, UserEntity> {
  constructor(private readonly userRepository: IUserRepositoryPort) {}

  public async Execute(email: unknown): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(Email.Create(email));

    if (!user) throw new ResourceNotFound("Usuário");

    return user;
  }
}
