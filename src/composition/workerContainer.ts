import { NotificationPolicy } from "../core/services";
import {
  DispatchNotificationUseCase,
  HandleDomainEventUseCase,
} from "../core/use-cases";
import { LoggingNotificationSender } from "../infrastructure/adapters/notification";
import {
  BullMqNotificationScheduler,
  IWorkerDependencies,
} from "../infrastructure/adapters/queue";
import { SystemClock } from "../infrastructure/adapters/system";
import { IInfrastructure } from "./infrastructure";

export const buildWorkerDependencies = (
  infrastructure: IInfrastructure
): IWorkerDependencies => {
  const { logger, repositories, queues } = infrastructure;
  const clock = new SystemClock();

  return {
    handleDomainEventUseCase: new HandleDomainEventUseCase(
      repositories.auditEvents,
      repositories.notifications,
      new BullMqNotificationScheduler(queues.notifications),
      repositories.users,
      new NotificationPolicy(),
      clock,
      logger
    ),
    dispatchNotificationUseCase: new DispatchNotificationUseCase(
      repositories.notifications,
      new LoggingNotificationSender(logger),
      clock,
      logger
    ),
  };
};
