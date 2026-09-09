import { Collection, Db, Filter } from "mongodb";
import { AuditEventEntity } from "../../../../core/entities";
import { DomainEventName, EventMetadata } from "../../../../core/events";
import {
  IAuditEventQuery,
  IAuditEventRepositoryPort,
} from "../../../../core/ports";
import { COLLECTIONS } from "./mongoClient";

interface IAuditEventDocument {
  _id: string;
  name: DomainEventName;
  occurredAt: Date;
  resourceType: string;
  resourceId: string;
  actorId: string | null;
  organizationId: string | null;
  requestId: string | null;
  metadata: EventMetadata;
}

export class AuditEventMongoRepository implements IAuditEventRepositoryPort {
  private readonly collection: Collection<IAuditEventDocument>;

  constructor(database: Db) {
    this.collection = database.collection<IAuditEventDocument>(
      COLLECTIONS.auditEvents
    );
  }

  public async append(event: AuditEventEntity): Promise<void> {
    await this.collection.updateOne(
      { _id: event.Id },
      {
        $setOnInsert: {
          name: event.Name,
          occurredAt: event.OccurredAt,
          resourceType: event.Resource.type,
          resourceId: event.Resource.id,
          actorId: event.ActorId,
          organizationId: event.OrganizationId,
          requestId: event.RequestId,
          metadata: event.Metadata,
        },
      },
      { upsert: true }
    );
  }

  public async findByOrganization(
    query: IAuditEventQuery
  ): Promise<AuditEventEntity[]> {
    const documents = await this.collection
      .find(AuditEventMongoRepository.ToFilter(query))
      .sort({ occurredAt: -1 })
      .limit(query.limit)
      .toArray();

    return documents.map(AuditEventMongoRepository.ToEntity);
  }

  private static ToFilter(
    query: IAuditEventQuery
  ): Filter<IAuditEventDocument> {
    const filter: Filter<IAuditEventDocument> = {
      organizationId: query.organizationId,
    };

    if (query.actorId) filter.actorId = query.actorId;
    if (query.name) filter.name = query.name;
    if (query.occurredBefore) {
      filter.occurredAt = { $lt: query.occurredBefore };
    }

    return filter;
  }

  private static ToEntity(document: IAuditEventDocument): AuditEventEntity {
    return AuditEventEntity.Restore({
      id: document._id,
      name: document.name,
      occurredAt: document.occurredAt,
      resource: { type: document.resourceType, id: document.resourceId },
      actorId: document.actorId,
      organizationId: document.organizationId,
      requestId: document.requestId,
      metadata: document.metadata,
    });
  }
}
