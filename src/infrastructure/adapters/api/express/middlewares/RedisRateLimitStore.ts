import { ClientRateLimitInfo, Options, Store } from "express-rate-limit";
import { Redis } from "ioredis";
import { ILoggerPort } from "../../../../../core/ports";

const FAIL_OPEN_HITS = 0;

export class RedisRateLimitStore implements Store {
  public readonly localKeys = false;

  private windowInMilliseconds = 0;

  constructor(
    private readonly client: Redis,
    private readonly namespace: string,
    private readonly logger: ILoggerPort
  ) {}

  public init(options: Options): void {
    this.windowInMilliseconds = options.windowMs;
  }

  public async increment(key: string): Promise<ClientRateLimitInfo> {
    const redisKey = this.KeyFor(key);

    try {
      const replies = await this.client
        .multi()
        .incr(redisKey)
        .pexpire(redisKey, this.windowInMilliseconds, "NX")
        .pttl(redisKey)
        .exec();

      return {
        totalHits: Number(replies?.[0]?.[1] ?? FAIL_OPEN_HITS),
        resetTime: this.ResetTimeFrom(Number(replies?.[2]?.[1] ?? -1)),
      };
    } catch (error) {
      this.ReportFailure("increment", error);

      return { totalHits: FAIL_OPEN_HITS, resetTime: undefined };
    }
  }

  public async decrement(key: string): Promise<void> {
    try {
      await this.client.decr(this.KeyFor(key));
    } catch (error) {
      this.ReportFailure("decrement", error);
    }
  }

  public async resetKey(key: string): Promise<void> {
    try {
      await this.client.unlink(this.KeyFor(key));
    } catch (error) {
      this.ReportFailure("resetKey", error);
    }
  }

  private KeyFor(key: string): string {
    return `${this.namespace}:rate-limit:${key}`;
  }

  private ResetTimeFrom(ttlInMilliseconds: number): Date | undefined {
    if (!Number.isFinite(ttlInMilliseconds) || ttlInMilliseconds < 0) {
      return undefined;
    }

    return new Date(Date.now() + ttlInMilliseconds);
  }

  private ReportFailure(operation: string, error: unknown): void {
    this.logger.error("Rate limit sem Redis, liberando a requisição", {
      operation,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}
