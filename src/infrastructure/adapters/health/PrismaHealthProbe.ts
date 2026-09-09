import { PrismaClient } from "@prisma/client";
import { IHealthProbePort } from "../../../core/ports";

export class PrismaHealthProbe implements IHealthProbePort {
  public readonly name = "mysql";

  constructor(private readonly client: PrismaClient) {}

  public async check(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}
