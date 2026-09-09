export interface INotificationSchedulerPort {
  schedule(notificationId: string): Promise<void>;
}
