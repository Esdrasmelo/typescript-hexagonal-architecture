import {
  DomainEventName,
  EventMetadata,
  IDomainEvent,
} from "../../../../core/events";

export interface IDomainEventPayload {
  id: string;
  name: DomainEventName;
  occurredAt: string;
  resourceType: string;
  resourceId: string;
  actorId: string | null;
  organizationId: string | null;
  requestId: string | null;
  metadata: EventMetadata;
}

export const encodeDomainEvent = (
  event: IDomainEvent
): IDomainEventPayload => ({
  id: event.id,
  name: event.name,
  occurredAt: event.occurredAt.toISOString(),
  resourceType: event.resource.type,
  resourceId: event.resource.id,
  actorId: event.actorId,
  organizationId: event.organizationId,
  requestId: event.requestId,
  metadata: event.metadata,
});

export const decodeDomainEvent = (
  payload: IDomainEventPayload
): IDomainEvent => ({
  id: payload.id,
  name: payload.name,
  occurredAt: new Date(payload.occurredAt),
  resource: { type: payload.resourceType, id: payload.resourceId },
  actorId: payload.actorId,
  organizationId: payload.organizationId,
  requestId: payload.requestId,
  metadata: payload.metadata ?? {},
});
