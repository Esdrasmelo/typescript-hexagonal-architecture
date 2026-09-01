import { Email, PlainPassword, UserEntity } from "../../entities";
import { InvalidCredentials, isDomainError } from "../../exceptions";
import {
  IPasswordHasherPort,
  ITokenServicePort,
  IUserRepositoryPort,
} from "../../ports";
import { IUseCase } from "../UseCase";

export interface ILoginInput {
  email: unknown;
  password: unknown;
}

export interface ILoginOutput {
  token: string;
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
    private readonly tokenService: ITokenServicePort
  ) {}

  public async Execute(input: ILoginInput): Promise<ILoginOutput> {
    const credentials = this.ReadCredentials(input);
    const user = await this.userRepository.findByEmail(credentials.email);

    const isPasswordValid = await this.passwordHasher.verify(
      credentials.password,
      this.StoredHashFor(user)
    );

    if (!user || !isPasswordValid) throw new InvalidCredentials();

    return {
      token: this.tokenService.sign({ sub: user.Id, email: user.Email.Value }),
      user,
    };
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
