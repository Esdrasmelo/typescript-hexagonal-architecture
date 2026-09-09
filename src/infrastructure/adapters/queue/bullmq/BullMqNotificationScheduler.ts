import { Queue } from "bullmq";
import { INotificationSchedulerPort } from "../../../../core/ports";
import { JOB_NAMES } from "./queues";

export class BullMqNotificationScheduler
  implements INotificationSchedulerPort
{
  constructor(private readonly queue: Queue) {}

  public async schedule(notificationId: string): Promise<void> {
    await this.queue.add(
      JOB_NAMES.dispatchNotification,
      { notificationId },
      { jobId: `notification-${notificationId}` }
    );
  }
}
