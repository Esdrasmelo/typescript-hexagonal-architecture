import { NotificationEntity } from "../entities";

export interface INotificationRepositoryPort {
  findById(notificationId: string): Promise<NotificationEntity | null>;
  findByRecipient(
    recipientId: string,
    limit: number
  ): Promise<NotificationEntity[]>;
  save(notification: NotificationEntity): Promise<NotificationEntity>;
}
