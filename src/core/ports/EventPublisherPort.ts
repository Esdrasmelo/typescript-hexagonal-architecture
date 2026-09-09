import { IDomainEvent } from "../events/DomainEvent";

export interface IEventPublisherPort {
  publish(event: IDomainEvent): Promise<void>;
}
