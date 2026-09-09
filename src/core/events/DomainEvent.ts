export const DOMAIN_EVENT_NAMES = [
  "user.registered",
  "user.logged-in",
  "user.logged-out",
  "organization.created",
  "organization.renamed",
  "membership.granted",
  "membership.role-changed",
  "membership.revoked",
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export type EventMetadata = Record<string, string | number | boolean | null>;

export interface IEventResource {
  type: string;
  id: string;
}

export interface IDomainEventDraft {
  name: DomainEventName;
  resource: IEventResource;
  actorId?: string | null;
  organizationId?: string | null;
  requestId?: string | null;
  metadata?: EventMetadata;
}

export interface IDomainEvent {
  id: string;
  name: DomainEventName;
  occurredAt: Date;
  resource: IEventResource;
  actorId: string | null;
  organizationId: string | null;
  requestId: string | null;
  metadata: EventMetadata;
}
