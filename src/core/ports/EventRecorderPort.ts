import { IDomainEventDraft } from "../events/DomainEvent";

export interface IEventRecorderPort {
  record(draft: IDomainEventDraft): Promise<void>;
}
