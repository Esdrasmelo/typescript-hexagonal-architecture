import { AuditEventEntity } from "../entities";
import { DomainEventName } from "../events/DomainEvent";

export interface IAuditEventQuery {
  organizationId: string;
  limit: number;
  actorId?: string | null;
  name?: DomainEventName | null;
  occurredBefore?: Date | null;
}

export interface IAuditEventRepositoryPort {
  append(event: AuditEventEntity): Promise<void>;
  findByOrganization(query: IAuditEventQuery): Promise<AuditEventEntity[]>;
}
