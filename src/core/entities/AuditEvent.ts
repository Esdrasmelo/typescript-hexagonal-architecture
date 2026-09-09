import {
  DomainEventName,
  EventMetadata,
  IDomainEvent,
  IEventResource,
} from "../events/DomainEvent";

export interface IAuditEventProps {
  id: string;
  name: DomainEventName;
  occurredAt: Date;
  resource: IEventResource;
  actorId: string | null;
  organizationId: string | null;
  requestId: string | null;
  metadata: EventMetadata;
}

export class AuditEventEntity {
  private constructor(private readonly props: IAuditEventProps) {}

  public static FromEvent(event: IDomainEvent): AuditEventEntity {
    return new AuditEventEntity({
      id: event.id,
      name: event.name,
      occurredAt: event.occurredAt,
      resource: event.resource,
      actorId: event.actorId,
      organizationId: event.organizationId,
      requestId: event.requestId,
      metadata: event.metadata,
    });
  }

  public static Restore(props: IAuditEventProps): AuditEventEntity {
    return new AuditEventEntity(props);
  }

  public get Id(): string {
    return this.props.id;
  }

  public get Name(): DomainEventName {
    return this.props.name;
  }

  public get OccurredAt(): Date {
    return this.props.occurredAt;
  }

  public get Resource(): IEventResource {
    return this.props.resource;
  }

  public get ActorId(): string | null {
    return this.props.actorId;
  }

  public get OrganizationId(): string | null {
    return this.props.organizationId;
  }

  public get RequestId(): string | null {
    return this.props.requestId;
  }

  public get Metadata(): EventMetadata {
    return this.props.metadata;
  }
}
