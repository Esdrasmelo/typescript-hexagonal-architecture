import { Redis } from "ioredis";
import { ICachePort } from "../../../core/ports";

export class RedisCache implements ICachePort {
  constructor(
    private readonly client: Redis,
    private readonly namespace: string
  ) {}

  public async get<TValue>(key: string): Promise<TValue | null> {
    const raw = await this.client.get(this.KeyFor(key));

    if (raw === null) return null;

    return this.Parse<TValue>(raw);
  }

  public async set<TValue>(
    key: string,
    value: TValue,
    ttlInSeconds: number
  ): Promise<void> {
    await this.client.set(
      this.KeyFor(key),
      JSON.stringify(value),
      "EX",
      ttlInSeconds
    );
  }

  public async delete(key: string): Promise<void> {
    await this.client.unlink(this.KeyFor(key));
  }

  private KeyFor(key: string): string {
    return `${this.namespace}:cache:${key}`;
  }

  private Parse<TValue>(raw: string): TValue | null {
    try {
      return JSON.parse(raw) as TValue;
    } catch {
      return null;
    }
  }
}
