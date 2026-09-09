import { AuditEventEntity, NotificationEntity } from "../../src/core/entities";
import {
  IAuditEventQuery,
  IAuditEventRepositoryPort,
  INotificationRepositoryPort,
} from "../../src/core/ports";

export class InMemoryNotificationRepository
  implements INotificationRepositoryPort
{
  private readonly notifications = new Map<string, NotificationEntity>();

  public async findById(
    notificationId: string
  ): Promise<NotificationEntity | null> {
    return this.notifications.get(notificationId) ?? null;
  }

  public async findByRecipient(
    recipientId: string,
    limit: number
  ): Promise<NotificationEntity[]> {
    return [...this.notifications.values()]
      .filter((notification) => notification.RecipientId === recipientId)
      .sort(
        (first, second) =>
          second.CreatedAt.getTime() - first.CreatedAt.getTime()
      )
      .slice(0, limit);
  }

  public async save(
    notification: NotificationEntity
  ): Promise<NotificationEntity> {
    this.notifications.set(notification.Id, notification);

    return notification;
  }
}

export class InMemoryAuditEventRepository
  implements IAuditEventRepositoryPort
{
  private readonly events = new Map<string, AuditEventEntity>();

  public async append(event: AuditEventEntity): Promise<void> {
    if (this.events.has(event.Id)) return;

    this.events.set(event.Id, event);
  }

  public async findByOrganization(
    query: IAuditEventQuery
  ): Promise<AuditEventEntity[]> {
    return [...this.events.values()]
      .filter((event) => this.Matches(event, query))
      .sort(
        (first, second) =>
          second.OccurredAt.getTime() - first.OccurredAt.getTime()
      )
      .slice(0, query.limit);
  }

  public get All(): AuditEventEntity[] {
    return [...this.events.values()];
  }

  private Matches(
    event: AuditEventEntity,
    query: IAuditEventQuery
  ): boolean {
    if (event.OrganizationId !== query.organizationId) return false;
    if (query.actorId && event.ActorId !== query.actorId) return false;
    if (query.name && event.Name !== query.name) return false;
    if (query.occurredBefore && event.OccurredAt >= query.occurredBefore) {
      return false;
    }

    return true;
  }
}
