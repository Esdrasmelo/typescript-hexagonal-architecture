import { PlainPassword } from "../entities";

export interface IPasswordHasherPort {
  hash(password: PlainPassword): Promise<string>;
  verify(password: PlainPassword, storedHash: string): Promise<boolean>;
  hashThatNeverMatches(): string;
}
