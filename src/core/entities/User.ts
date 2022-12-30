require("dotenv");
import {
  NonProvidedField,
  EmailIsNotValid,
  PasswordLenghtIsTooSmall,
} from "../exceptions";
import { IUserEntityIn } from "./in";
import { IUserEntityOut } from "./out";
import crypto from "crypto";

export class UserEntity {
  private id: string;
  private name: string;
  private email: string;
  private password: string;
  private created_at: Date;
  private updated_at: Date;

  constructor({ email, name, password }: IUserEntityIn) {
    this.id = crypto.randomUUID();
    this.SetEmail = email;
    this.SetName = name;
    this.SetPassword = password;
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  public GetAllProperties(): IUserEntityOut {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  public set SetName(name: string) {
    if (!name) throw new NonProvidedField("name");
    this.name = name;
  }

  public get GetName(): string {
    return this.name;
  }

  public set SetEmail(email: string) {
    if (!email) throw new NonProvidedField("email");

    const regex =
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const isItValid = email.toLowerCase().match(regex);

    if (!isItValid) throw new EmailIsNotValid();

    this.email = email;
  }

  public get GetEmail(): string {
    return this.email;
  }

  public set SetPassword(password: string) {
    if (!password) throw new NonProvidedField("password");
    else if (password.length < 8) throw new PasswordLenghtIsTooSmall();

    const hashedPassword = this.HashPassword(password);
    this.password = hashedPassword;
  }

  public get GetPassword(): string {
    return this.password;
  }

  private HashPassword(password: string): string {
    const hash = crypto.pbkdf2Sync(
      password,
      String(process.env.HASH_SALT),
      1000,
      64,
      "sha512"
    );

    return hash.toString("hex");
  }

  public static ComparePassword(
    storedPassword: string,
    providedPassword: string
  ): boolean {
    const hash = crypto.pbkdf2Sync(
      providedPassword,
      String(process.env.HASH_SALT),
      1000,
      64,
      "sha512"
    );

    return hash.toString("hex") === storedPassword;
  }

  public CreateUser({ name, email, password }: IUserEntityIn): UserEntity {
    const user = new UserEntity({ name, email, password });

    return user;
  }
}
