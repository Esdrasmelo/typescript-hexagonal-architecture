import { OrganizationEntity } from "../../entities";
import {
  IClockPort,
  IEventRecorderPort,
  IOrganizationRepositoryPort,
} from "../../ports";
import { OrganizationAccess, OrganizationCache } from "../../services";
import { IUseCase } from "../UseCase";

export interface IRenameOrganizationInput {
  slug: unknown;
  name: unknown;
  actorId: string;
  requestId?: string | null;
}

const ACTION = "renomear esta organização";

export class RenameOrganizationUseCase
  implements IUseCase<IRenameOrganizationInput, OrganizationEntity>
{
  constructor(
    private readonly organizationAccess: OrganizationAccess,
    private readonly organizationRepository: IOrganizationRepositoryPort,
    private readonly organizationCache: OrganizationCache,
    private readonly clock: IClockPort,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(
    input: IRenameOrganizationInput
  ): Promise<OrganizationEntity> {
    const { organization } =
      await this.organizationAccess.ResolveForManagement(
        input.slug,
        input.actorId,
        ACTION
      );

    const renamed = await this.organizationRepository.update(
      organization.Rename(input.name as string, this.clock.now())
    );

    await this.organizationCache.InvalidateOrganization(renamed.Id);

    await this.eventRecorder.record({
      name: "organization.renamed",
      resource: { type: "organization", id: renamed.Id },
      actorId: input.actorId,
      organizationId: renamed.Id,
      requestId: input.requestId,
      metadata: { from: organization.Name, to: renamed.Name },
    });

    return renamed;
  }
}
