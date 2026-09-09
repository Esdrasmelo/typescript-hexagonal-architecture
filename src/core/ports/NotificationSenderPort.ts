import { NotificationEntity } from "../entities";

export interface INotificationSenderPort {
  send(notification: NotificationEntity): Promise<void>;
}
