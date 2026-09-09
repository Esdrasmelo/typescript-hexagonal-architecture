import { NotificationEntity } from "../../entities";
import { INotificationRepositoryPort } from "../../ports";
import { IUseCase } from "../UseCase";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface IListUserNotificationsInput {
  recipientId: string;
  limit?: number;
}

export class ListUserNotificationsUseCase
  implements IUseCase<IListUserNotificationsInput, NotificationEntity[]>
{
  constructor(
    private readonly notificationRepository: INotificationRepositoryPort
  ) {}

  public async Execute(
    input: IListUserNotificationsInput
  ): Promise<NotificationEntity[]> {
    return this.notificationRepository.findByRecipient(
      input.recipientId,
      this.ClampLimit(input.limit)
    );
  }

  private ClampLimit(limit?: number): number {
    if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;

    return Math.min(Math.trunc(limit), MAX_LIMIT);
  }
}
