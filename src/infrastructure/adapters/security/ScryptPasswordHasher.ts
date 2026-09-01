import {
  randomBytes,
  scrypt,
  ScryptOptions,
  timingSafeEqual,
} from "node:crypto";
import { PlainPassword } from "../../../core/entities";
import { IPasswordHasherPort } from "../../../core/ports";

const ALGORITHM = "scrypt";
const COST_FACTOR = 32768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY_BYTES = 192 * 1024 * 1024;
const MAX_ACCEPTED_COST = 1_048_576;
const ENCODED_FIELD_COUNT = 6;

interface IDerivationParams {
  costFactor: number;
  blockSize: number;
  parallelization: number;
  keyLength: number;
}

interface IDecodedHash extends Omit<IDerivationParams, "keyLength"> {
  salt: Buffer;
  hash: Buffer;
}

const deriveKey = (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

const DEFAULT_PARAMS: IDerivationParams = {
  costFactor: COST_FACTOR,
  blockSize: BLOCK_SIZE,
  parallelization: PARALLELIZATION,
  keyLength: KEY_LENGTH,
};

export class ScryptPasswordHasher implements IPasswordHasherPort {
  private readonly unmatchableHash: string;

  constructor() {
    this.unmatchableHash = this.Encode(
      randomBytes(SALT_LENGTH),
      randomBytes(KEY_LENGTH)
    );
  }

  public async hash(password: PlainPassword): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);

    return this.Encode(salt, await this.Derive(password.Value, salt, DEFAULT_PARAMS));
  }

  public async verify(
    password: PlainPassword,
    storedHash: string
  ): Promise<boolean> {
    const decoded = this.Decode(storedHash);

    if (!decoded) return false;

    const derived = await this.Derive(password.Value, decoded.salt, {
      costFactor: decoded.costFactor,
      blockSize: decoded.blockSize,
      parallelization: decoded.parallelization,
      keyLength: decoded.hash.length,
    });

    return (
      derived.length === decoded.hash.length &&
      timingSafeEqual(derived, decoded.hash)
    );
  }

  public hashThatNeverMatches(): string {
    return this.unmatchableHash;
  }

  private Derive(
    password: string,
    salt: Buffer,
    params: IDerivationParams
  ): Promise<Buffer> {
    return deriveKey(password, salt, params.keyLength, {
      N: params.costFactor,
      r: params.blockSize,
      p: params.parallelization,
      maxmem: MAX_MEMORY_BYTES,
    });
  }

  private Encode(salt: Buffer, hash: Buffer): string {
    return [
      ALGORITHM,
      COST_FACTOR,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString("base64"),
      hash.toString("base64"),
    ].join("$");
  }

  private Decode(stored: string): IDecodedHash | null {
    if (typeof stored !== "string") return null;

    const parts = stored.split("$");

    if (parts.length !== ENCODED_FIELD_COUNT) return null;

    const [algorithm, rawCost, rawBlock, rawParallel, rawSalt, rawHash] = parts;

    if (algorithm !== ALGORITHM) return null;

    const costFactor = Number(rawCost);
    const blockSize = Number(rawBlock);
    const parallelization = Number(rawParallel);

    if (
      !this.IsAcceptedCost(costFactor) ||
      !this.IsAcceptedCost(blockSize) ||
      !this.IsAcceptedCost(parallelization)
    ) {
      return null;
    }

    const salt = Buffer.from(rawSalt, "base64");
    const hash = Buffer.from(rawHash, "base64");

    if (salt.length === 0 || hash.length === 0) return null;

    return { costFactor, blockSize, parallelization, salt, hash };
  }

  private IsAcceptedCost(value: number): boolean {
    return Number.isInteger(value) && value > 0 && value <= MAX_ACCEPTED_COST;
  }
}
