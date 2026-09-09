import { Email, PlainPassword, UserEntity } from "../../entities";
import { InvalidCredentials, isDomainError } from "../../exceptions";
import {
  IEventRecorderPort,
  IPasswordHasherPort,
  ITokenServicePort,
  IUserRepositoryPort,
} from "../../ports";
import { IUseCase } from "../UseCase";

export interface ILoginInput {
  email: unknown;
  password: unknown;
  requestId?: string | null;
}

export interface ILoginOutput {
  token: string;
  expiresAt: Date;
  user: UserEntity;
}

interface ICredentials {
  email: Email;
  password: PlainPassword;
}

export class LoginUseCase implements IUseCase<ILoginInput, ILoginOutput> {
  constructor(
    private readonly userRepository: IUserRepositoryPort,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly tokenService: ITokenServicePort,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(input: ILoginInput): Promise<ILoginOutput> {
    const credentials = this.ReadCredentials(input);
    const user = await this.userRepository.findByEmail(credentials.email);

    const isPasswordValid = await this.passwordHasher.verify(
      credentials.password,
      this.StoredHashFor(user)
    );

    if (!user || !isPasswordValid) throw new InvalidCredentials();

    const issued = this.tokenService.sign({
      sub: user.Id,
      email: user.Email.Value,
    });

    await this.eventRecorder.record({
      name: "user.logged-in",
      resource: { type: "user", id: user.Id },
      actorId: user.Id,
      requestId: input.requestId,
      metadata: { tokenId: issued.id },
    });

    return { token: issued.token, expiresAt: issued.expiresAt, user };
  }

  private StoredHashFor(user: UserEntity | null): string {
    return user
      ? user.PasswordHash
      : this.passwordHasher.hashThatNeverMatches();
  }

  private ReadCredentials(input: ILoginInput): ICredentials {
    try {
      return this.ParseCredentials(input);
    } catch (error) {
      throw this.HideParsingDetails(error);
    }
  }

  private ParseCredentials(input: ILoginInput): ICredentials {
    return {
      email: Email.Create(input.email),
      password: PlainPassword.Create(input.password),
    };
  }

  private HideParsingDetails(error: unknown): unknown {
    return isDomainError(error) ? new InvalidCredentials() : error;
  }
}
