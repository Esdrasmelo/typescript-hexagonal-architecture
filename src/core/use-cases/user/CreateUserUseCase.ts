import { Email, PlainPassword, UserEntity } from "../../entities";
import { DataAlreadyExists } from "../../exceptions";
import {
  IClockPort,
  IEventRecorderPort,
  IIdGeneratorPort,
  IPasswordHasherPort,
  IUserRepositoryPort,
} from "../../ports";
import { IUseCase } from "../UseCase";

export interface ICreateUserInput {
  name: unknown;
  email: unknown;
  password: unknown;
  requestId?: string | null;
}

export class CreateUserUseCase
  implements IUseCase<ICreateUserInput, UserEntity>
{
  constructor(
    private readonly userRepository: IUserRepositoryPort,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly idGenerator: IIdGeneratorPort,
    private readonly clock: IClockPort,
    private readonly eventRecorder: IEventRecorderPort
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

    const created = await this.userRepository.create(user);

    await this.eventRecorder.record({
      name: "user.registered",
      resource: { type: "user", id: created.Id },
      actorId: created.Id,
      requestId: input.requestId,
      metadata: { name: created.Name, email: created.Email.Value },
    });

    return created;
  }

  private async EnsureEmailIsAvailable(email: Email): Promise<void> {
    if (await this.userRepository.findByEmail(email)) {
      throw new DataAlreadyExists("Usuário");
    }
  }
}
