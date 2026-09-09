import {
  IClockPort,
  IEventPublisherPort,
  IEventRecorderPort,
  IIdGeneratorPort,
  ILoggerPort,
} from "../ports";
import { IDomainEvent, IDomainEventDraft } from "./DomainEvent";

export class EventRecorder implements IEventRecorderPort {
  constructor(
    private readonly publisher: IEventPublisherPort,
    private readonly idGenerator: IIdGeneratorPort,
    private readonly clock: IClockPort,
    private readonly logger: ILoggerPort
  ) {}

  public async record(draft: IDomainEventDraft): Promise<void> {
    const event = this.Build(draft);

    try {
      await this.publisher.publish(event);
    } catch (error) {
      this.logger.error("Evento de domínio não pôde ser publicado", {
        event: event.name,
        eventId: event.id,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private Build(draft: IDomainEventDraft): IDomainEvent {
    return {
      id: this.idGenerator.generate(),
      name: draft.name,
      occurredAt: this.clock.now(),
      resource: draft.resource,
      actorId: draft.actorId ?? null,
      organizationId: draft.organizationId ?? null,
      requestId: draft.requestId ?? null,
      metadata: draft.metadata ?? {},
    };
  }
}
