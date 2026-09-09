import { Redis } from "ioredis";
import { IHealthProbePort } from "../../../core/ports";

export class RedisHealthProbe implements IHealthProbePort {
  public readonly name = "redis";

  constructor(private readonly client: Redis) {}

  public async check(): Promise<void> {
    await this.client.ping();
  }
}
