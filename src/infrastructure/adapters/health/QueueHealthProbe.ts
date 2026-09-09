import { Queue } from "bullmq";
import { IHealthProbePort } from "../../../core/ports";

export class QueueHealthProbe implements IHealthProbePort {
  public readonly name = "queues";

  constructor(private readonly queues: readonly Queue[]) {}

  public async check(): Promise<void> {
    await Promise.all(this.queues.map((queue) => queue.getJobCounts()));
  }
}
