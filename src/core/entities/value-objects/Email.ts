import { EmailIsNotValid, NonProvidedField } from "../../exceptions";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const MAX_EMAIL_LENGTH = 254;

export class Email {
  private constructor(public readonly Value: string) {}

  public static Create(email: unknown): Email {
    const provided = Email.EnsureProvided(email);
    const normalized = provided.trim().toLowerCase();

    Email.EnsureShapeIsValid(normalized);

    return new Email(normalized);
  }

  public Equals(other: Email): boolean {
    return this.Value === other.Value;
  }

  public toString(): string {
    return this.Value;
  }

  private static EnsureProvided(email: unknown): string {
    if (typeof email !== "string" || email.trim().length === 0) {
      throw new NonProvidedField("email");
    }

    return email;
  }

  private static EnsureShapeIsValid(email: string): void {
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(email)) {
      throw new EmailIsNotValid();
    }
  }
}
