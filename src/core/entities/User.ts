import { NonProvidedField } from "../exceptions";
import { Email } from "./value-objects";

export interface IUserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  now: Date;
}

export class UserEntity {
  private constructor(private readonly props: IUserProps) {}

  public static Create(input: ICreateUserProps): UserEntity {
    const name = UserEntity.EnsureNameIsProvided(input.name);

    if (!input.passwordHash) throw new NonProvidedField("passwordHash");

    return new UserEntity({
      id: input.id,
      name,
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static Restore(props: IUserProps): UserEntity {
    return new UserEntity(props);
  }

  public get Id(): string {
    return this.props.id;
  }

  public get Name(): string {
    return this.props.name;
  }

  public get Email(): Email {
    return this.props.email;
  }

  public get PasswordHash(): string {
    return this.props.passwordHash;
  }

  public get CreatedAt(): Date {
    return this.props.createdAt;
  }

  public get UpdatedAt(): Date {
    return this.props.updatedAt;
  }

  private static EnsureNameIsProvided(name: string): string {
    const trimmed = typeof name === "string" ? name.trim() : "";

    if (!trimmed) throw new NonProvidedField("name");

    return trimmed;
  }
}
