import { ICachePort, ILoggerPort } from "../../../core/ports";

export class ResilientCache implements ICachePort {
  constructor(
    private readonly cache: ICachePort,
    private readonly logger: ILoggerPort
  ) {}

  public async get<TValue>(key: string): Promise<TValue | null> {
    return this.Guard("get", key, () => this.cache.get<TValue>(key), null);
  }

  public async set<TValue>(
    key: string,
    value: TValue,
    ttlInSeconds: number
  ): Promise<void> {
    await this.Guard(
      "set",
      key,
      () => this.cache.set(key, value, ttlInSeconds),
      undefined
    );
  }

  public async delete(key: string): Promise<void> {
    await this.Guard("delete", key, () => this.cache.delete(key), undefined);
  }

  private async Guard<TResult>(
    operation: string,
    key: string,
    run: () => Promise<TResult>,
    fallback: TResult
  ): Promise<TResult> {
    try {
      return await run();
    } catch (error) {
      this.logger.warn("Cache indisponível, seguindo sem ele", {
        operation,
        key,
        reason: error instanceof Error ? error.message : String(error),
      });

      return fallback;
    }
  }
}
