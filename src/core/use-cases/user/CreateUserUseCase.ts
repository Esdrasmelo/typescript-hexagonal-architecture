import { Email, PlainPassword, UserEntity } from "../../entities";
import { DataAlreadyExists } from "../../exceptions";
import {
  IClockPort,
  IIdGeneratorPort,
  IPasswordHasherPort,
  IUserRepositoryPort,
} from "../../ports";
import { IUseCase } from "../UseCase";

export interface ICreateUserInput {
  name: unknown;
  email: unknown;
  password: unknown;
}

export class CreateUserUseCase
  implements IUseCase<ICreateUserInput, UserEntity>
{
  constructor(
    private readonly userRepository: IUserRepositoryPort,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly idGenerator: IIdGeneratorPort,
    private readonly clock: IClockPort
  ) {}

  public async Execute(input: ICreateUserInput): Promise<UserEntity> {
    const email = Email.Create(input.email);
    const password = PlainPassword.Create(input.password);

    await this.EnsureEmailIsAvailable(email);

    const user = UserEntity.Create({
      id: this.idGenerator.generate(),
      name: input.name as string,
      email,
      passwordHash: await this.passwordHasher.hash(password),
      now: this.clock.now(),
    });

    return this.userRepository.create(user);
  }

  private async EnsureEmailIsAvailable(email: Email): Promise<void> {
    if (await this.userRepository.findByEmail(email)) {
      throw new DataAlreadyExists("Usuário");
    }
  }
}
