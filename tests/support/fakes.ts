import { PlainPassword } from "../../src/core/entities";
import { InvalidToken } from "../../src/core/exceptions";
import {
  IClockPort,
  IIdGeneratorPort,
  IPasswordHasherPort,
  ITokenPayload,
  ITokenServicePort,
} from "../../src/core/ports";

export class FixedClock implements IClockPort {
  constructor(private readonly fixed = new Date("2026-01-01T12:00:00.000Z")) {}

  public now(): Date {
    return this.fixed;
  }
}

export class SequentialIdGenerator implements IIdGeneratorPort {
  private counter = 0;

  public generate(): string {
    this.counter += 1;

    return `id-${this.counter}`;
  }
}

export class FakePasswordHasher implements IPasswordHasherPort {
  public verifyCalls = 0;

  public async hash(password: PlainPassword): Promise<string> {
    return `hashed:${password.Value}`;
  }

  public async verify(
    password: PlainPassword,
    storedHash: string
  ): Promise<boolean> {
    this.verifyCalls += 1;

    return storedHash === `hashed:${password.Value}`;
  }

  public hashThatNeverMatches(): string {
    return "hashed:__inexistente__";
  }
}

export class FakeTokenService implements ITokenServicePort {
  public sign(payload: ITokenPayload): string {
    return `token:${payload.sub}:${payload.email}`;
  }

  public verify(token: string): ITokenPayload {
    const [prefix, sub, email] = token.split(":");

    if (prefix !== "token" || !sub || !email) throw new InvalidToken();

    return { sub, email };
  }
}
