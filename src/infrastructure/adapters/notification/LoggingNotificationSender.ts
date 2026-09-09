import { NotificationEntity } from "../../../core/entities";
import { ILoggerPort, INotificationSenderPort } from "../../../core/ports";

export class LoggingNotificationSender implements INotificationSenderPort {
  constructor(private readonly logger: ILoggerPort) {}

  public async send(notification: NotificationEntity): Promise<void> {
    this.logger.info("Notificação entregue", {
      notificationId: notification.Id,
      recipient: notification.RecipientEmail.Value,
      subject: notification.Subject,
    });
  }
}
