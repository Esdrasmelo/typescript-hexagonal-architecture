import { AuditEventEntity } from "../../entities";
import { DomainEventName } from "../../events";
import { IAuditEventRepositoryPort } from "../../ports";
import { OrganizationAccess } from "../../services";
import { IUseCase } from "../UseCase";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const ACTION = "consultar a auditoria desta organização";

export interface IListAuditEventsInput {
  slug: unknown;
  actorId: string;
  limit?: number;
  name?: DomainEventName | null;
  performedBy?: string | null;
  occurredBefore?: Date | null;
}

export class ListAuditEventsUseCase
  implements IUseCase<IListAuditEventsInput, AuditEventEntity[]>
{
  constructor(
    private readonly organizationAccess: OrganizationAccess,
    private readonly auditEventRepository: IAuditEventRepositoryPort
  ) {}

  public async Execute(
    input: IListAuditEventsInput
  ): Promise<AuditEventEntity[]> {
    const { organization } =
      await this.organizationAccess.ResolveForManagement(
        input.slug,
        input.actorId,
        ACTION
      );

    return this.auditEventRepository.findByOrganization({
      organizationId: organization.Id,
      limit: this.ClampLimit(input.limit),
      actorId: input.performedBy,
      name: input.name,
      occurredBefore: input.occurredBefore,
    });
  }

  private ClampLimit(limit?: number): number {
    if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;

    return Math.min(Math.trunc(limit), MAX_LIMIT);
  }
}
