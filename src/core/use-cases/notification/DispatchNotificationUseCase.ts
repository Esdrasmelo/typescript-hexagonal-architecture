import { NotificationEntity } from "../../entities";
import { ResourceNotFound } from "../../exceptions";
import {
  IClockPort,
  ILoggerPort,
  INotificationRepositoryPort,
  INotificationSenderPort,
} from "../../ports";
import { IUseCase } from "../UseCase";

export class DispatchNotificationUseCase
  implements IUseCase<string, NotificationEntity>
{
  constructor(
    private readonly notificationRepository: INotificationRepositoryPort,
    private readonly notificationSender: INotificationSenderPort,
    private readonly clock: IClockPort,
    private readonly logger: ILoggerPort
  ) {}

  public async Execute(notificationId: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findById(
      notificationId
    );

    if (!notification) throw new ResourceNotFound("Notificação");
    if (notification.IsDelivered) return notification;

    try {
      await this.notificationSender.send(notification);
    } catch (error) {
      await this.RegisterFailure(notification, error);

      throw error;
    }

    return this.notificationRepository.save(
      notification.MarkAsDelivered(this.clock.now())
    );
  }

  private async RegisterFailure(
    notification: NotificationEntity,
    error: unknown
  ): Promise<void> {
    const reason = error instanceof Error ? error.message : String(error);

    const failed = await this.notificationRepository.save(
      notification.MarkAsFailed(reason, this.clock.now())
    );

    this.logger.warn("Entrega de notificação falhou", {
      notificationId: failed.Id,
      attempts: failed.Attempts,
      reason,
    });
  }
}
