import {
  AuditEventEntity,
  NotificationEntity,
} from "../../../../../core/entities";
import { EventMetadata } from "../../../../../core/events";

export interface INotificationResponse {
  id: string;
  subject: string;
  body: string;
  status: string;
  attempts: number;
  delivered_at: string | null;
  created_at: string;
}

export interface IAuditEventResponse {
  id: string;
  event: string;
  occurred_at: string;
  actor_id: string | null;
  resource: { type: string; id: string };
  request_id: string | null;
  metadata: EventMetadata;
}

export const toNotificationResponse = (
  notification: NotificationEntity
): INotificationResponse => ({
  id: notification.Id,
  subject: notification.Subject,
  body: notification.Body,
  status: notification.Status,
  attempts: notification.Attempts,
  delivered_at: notification.DeliveredAt?.toISOString() ?? null,
  created_at: notification.CreatedAt.toISOString(),
});

export const toNotificationResponseList = (
  notifications: readonly NotificationEntity[]
): INotificationResponse[] => notifications.map(toNotificationResponse);

export const toAuditEventResponse = (
  event: AuditEventEntity
): IAuditEventResponse => ({
  id: event.Id,
  event: event.Name,
  occurred_at: event.OccurredAt.toISOString(),
  actor_id: event.ActorId,
  resource: { type: event.Resource.type, id: event.Resource.id },
  request_id: event.RequestId,
  metadata: event.Metadata,
});

export const toAuditEventResponseList = (
  events: readonly AuditEventEntity[]
): IAuditEventResponse[] => events.map(toAuditEventResponse);
