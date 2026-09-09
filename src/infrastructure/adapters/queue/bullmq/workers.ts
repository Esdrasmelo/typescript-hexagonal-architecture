import { Job, UnrecoverableError, Worker } from "bullmq";
import { Redis } from "ioredis";
import { isDomainError } from "../../../../core/exceptions";
import { ILoggerPort } from "../../../../core/ports";
import {
  DispatchNotificationUseCase,
  HandleDomainEventUseCase,
} from "../../../../core/use-cases";
import { Env } from "../../../config/env";
import { decodeDomainEvent, IDomainEventPayload } from "./domainEventCodec";
import { QUEUE_NAMES } from "./queues";

const PERMANENT_FAILURES = ["VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"];

export interface IWorkerDependencies {
  handleDomainEventUseCase: HandleDomainEventUseCase;
  dispatchNotificationUseCase: DispatchNotificationUseCase;
}

interface IDispatchNotificationPayload {
  notificationId: string;
}

const asFinalFailure = (error: unknown): unknown => {
  if (isDomainError(error) && PERMANENT_FAILURES.includes(error.code)) {
    return new UnrecoverableError(error.message);
  }

  return error;
};

const runOrGiveUp = async (work: Promise<unknown>): Promise<void> => {
  try {
    await work;
  } catch (error) {
    throw asFinalFailure(error);
  }
};

const observe = (worker: Worker, logger: ILoggerPort): Worker => {
  worker.on("failed", (job: Job | undefined, error: Error) => {
    logger.error("Job falhou", {
      queue: worker.name,
      jobId: job?.id ?? null,
      attempts: job?.attemptsMade ?? null,
      reason: error.message,
    });
  });

  worker.on("error", (error: Error) => {
    logger.error("Worker reportou erro", {
      queue: worker.name,
      reason: error.message,
    });
  });

  return worker;
};

export const createWorkers = (
  connection: Redis,
  env: Env,
  dependencies: IWorkerDependencies,
  logger: ILoggerPort
): Worker[] => {
  const options = {
    connection,
    prefix: env.CACHE_NAMESPACE,
    concurrency: env.QUEUE_CONCURRENCY,
  };

  const domainEvents = new Worker<IDomainEventPayload>(
    QUEUE_NAMES.domainEvents,
    (job) =>
      runOrGiveUp(
        dependencies.handleDomainEventUseCase.Execute(
          decodeDomainEvent(job.data)
        )
      ),
    options
  );

  const notifications = new Worker<IDispatchNotificationPayload>(
    QUEUE_NAMES.notifications,
    (job) =>
      runOrGiveUp(
        dependencies.dispatchNotificationUseCase.Execute(
          job.data.notificationId
        )
      ),
    options
  );

  return [
    observe(domainEvents, logger),
    observe(notifications, logger),
  ];
};

export const closeWorkers = async (workers: Worker[]): Promise<void> => {
  await Promise.all(workers.map((worker) => worker.close()));
};
