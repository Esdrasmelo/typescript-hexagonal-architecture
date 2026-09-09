import { Db } from "mongodb";
import { IHealthProbePort } from "../../../core/ports";

export class MongoHealthProbe implements IHealthProbePort {
  public readonly name = "mongodb";

  constructor(private readonly database: Db) {}

  public async check(): Promise<void> {
    await this.database.command({ ping: 1 });
  }
}
