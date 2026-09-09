import { OrganizationEntity } from "../../entities";
import { IOrganizationRepositoryPort } from "../../ports";
import { OrganizationCache } from "../../services";
import { IUseCase } from "../UseCase";

export class ListUserOrganizationsUseCase
  implements IUseCase<string, OrganizationEntity[]>
{
  constructor(
    private readonly organizationRepository: IOrganizationRepositoryPort,
    private readonly organizationCache: OrganizationCache
  ) {}

  public async Execute(actorId: string): Promise<OrganizationEntity[]> {
    const cached = await this.organizationCache.Read(actorId);

    if (cached) return cached;

    const organizations = await this.organizationRepository.findAllForMember(
      actorId
    );

    await this.organizationCache.Write(actorId, organizations);

    return organizations;
  }
}
