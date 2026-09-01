import {
  NonProvidedField,
  PasswordIsTooLong,
  PasswordIsTooShort,
} from "../../exceptions";

const REDACTED = "[REDACTED]";

export class PlainPassword {
  public static readonly MIN_LENGTH = 8;
  public static readonly MAX_LENGTH = 128;

  private constructor(public readonly Value: string) {}

  public static Create(password: unknown): PlainPassword {
    const provided = PlainPassword.EnsureProvided(password);

    PlainPassword.EnsureLengthIsWithinLimits(provided);

    return new PlainPassword(provided);
  }

  public toString(): string {
    return REDACTED;
  }

  public toJSON(): string {
    return REDACTED;
  }

  private static EnsureProvided(password: unknown): string {
    if (typeof password !== "string" || password.length === 0) {
      throw new NonProvidedField("password");
    }

    return password;
  }

  private static EnsureLengthIsWithinLimits(password: string): void {
    if (password.length < PlainPassword.MIN_LENGTH) {
      throw new PasswordIsTooShort(PlainPassword.MIN_LENGTH);
    }

    if (password.length > PlainPassword.MAX_LENGTH) {
      throw new PasswordIsTooLong(PlainPassword.MAX_LENGTH);
    }
  }
}
