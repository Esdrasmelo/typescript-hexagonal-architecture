import { MembershipEntity, MembershipRole, OrganizationEntity, Slug } from "../../entities";
import { DataAlreadyExists } from "../../exceptions";
import {
  IClockPort,
  IEventRecorderPort,
  IIdGeneratorPort,
  IOrganizationRepositoryPort,
} from "../../ports";
import { OrganizationCache } from "../../services";
import { IUseCase } from "../UseCase";

export interface ICreateOrganizationInput {
  name: unknown;
  slug?: unknown;
  actorId: string;
  requestId?: string | null;
}

export class CreateOrganizationUseCase
  implements IUseCase<ICreateOrganizationInput, OrganizationEntity>
{
  constructor(
    private readonly organizationRepository: IOrganizationRepositoryPort,
    private readonly organizationCache: OrganizationCache,
    private readonly idGenerator: IIdGeneratorPort,
    private readonly clock: IClockPort,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(
    input: ICreateOrganizationInput
  ): Promise<OrganizationEntity> {
    const slug = this.ReadSlug(input);

    await this.EnsureSlugIsAvailable(slug);

    const now = this.clock.now();
    const organization = OrganizationEntity.Create({
      id: this.idGenerator.generate(),
      name: input.name as string,
      slug,
      ownerId: input.actorId,
      now,
    });

    const owner = MembershipEntity.Create({
      id: this.idGenerator.generate(),
      organizationId: organization.Id,
      userId: input.actorId,
      role: MembershipRole.Owner,
      now,
    });

    const created = await this.organizationRepository.createWithOwner(
      organization,
      owner
    );

    await this.organizationCache.InvalidateUser(input.actorId);

    await this.eventRecorder.record({
      name: "organization.created",
      resource: { type: "organization", id: created.Id },
      actorId: input.actorId,
      organizationId: created.Id,
      requestId: input.requestId,
      metadata: { organization: created.Name, slug: created.Slug.Value },
    });

    return created;
  }

  private ReadSlug(input: ICreateOrganizationInput): Slug {
    return input.slug === undefined || input.slug === null
      ? Slug.FromText(input.name)
      : Slug.Create(input.slug);
  }

  private async EnsureSlugIsAvailable(slug: Slug): Promise<void> {
    if (await this.organizationRepository.findBySlug(slug)) {
      throw new DataAlreadyExists("Organização");
    }
  }
}
