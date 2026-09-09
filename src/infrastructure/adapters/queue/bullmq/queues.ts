import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { Env } from "../../../config/env";

export const QUEUE_NAMES = {
  domainEvents: "domain-events",
  notifications: "notifications",
} as const;

export const JOB_NAMES = {
  handleDomainEvent: "handle-domain-event",
  dispatchNotification: "dispatch-notification",
} as const;

export interface IQueues {
  domainEvents: Queue;
  notifications: Queue;
}

export const createQueues = (connection: Redis, env: Env): IQueues => {
  const options = {
    connection,
    prefix: env.CACHE_NAMESPACE,
    defaultJobOptions: {
      attempts: env.QUEUE_JOB_ATTEMPTS,
      backoff: {
        type: "exponential" as const,
        delay: env.QUEUE_BACKOFF_MILLISECONDS,
      },
      removeOnComplete: { count: env.QUEUE_KEEP_COMPLETED },
      removeOnFail: { count: env.QUEUE_KEEP_FAILED },
    },
  };

  return {
    domainEvents: new Queue(QUEUE_NAMES.domainEvents, options),
    notifications: new Queue(QUEUE_NAMES.notifications, options),
  };
};

export const closeQueues = async (queues: IQueues): Promise<void> => {
  await Promise.all([queues.domainEvents.close(), queues.notifications.close()]);
};
