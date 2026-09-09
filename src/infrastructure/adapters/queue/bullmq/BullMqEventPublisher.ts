import { Queue } from "bullmq";
import { IDomainEvent } from "../../../../core/events";
import { IEventPublisherPort } from "../../../../core/ports";
import { encodeDomainEvent } from "./domainEventCodec";
import { JOB_NAMES } from "./queues";

export class BullMqEventPublisher implements IEventPublisherPort {
  constructor(private readonly queue: Queue) {}

  public async publish(event: IDomainEvent): Promise<void> {
    await this.queue.add(
      JOB_NAMES.handleDomainEvent,
      encodeDomainEvent(event),
      { jobId: event.id }
    );
  }
}
