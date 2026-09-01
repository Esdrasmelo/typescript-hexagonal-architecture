import { randomUUID } from "node:crypto";
import { IIdGeneratorPort } from "../../../core/ports";

export class CryptoIdGenerator implements IIdGeneratorPort {
  public generate(): string {
    return randomUUID();
  }
}
