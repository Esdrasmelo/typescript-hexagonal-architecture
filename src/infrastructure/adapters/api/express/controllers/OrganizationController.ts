import {
  CreateOrganizationUseCase,
  GetOrganizationUseCase,
  ListUserOrganizationsUseCase,
  RenameOrganizationUseCase,
} from "../../../../../core/use-cases";
import {
  IOrganizationDetailResponse,
  IOrganizationResponse,
  toOrganizationDetailResponse,
  toOrganizationResponse,
  toOrganizationResponseList,
} from "../presenters/organizationPresenter";
import { created, HttpResult, IActorContext, ok } from "../protocols";
import {
  createOrganizationSchema,
  organizationParamsSchema,
  renameOrganizationSchema,
} from "../schemas";

export interface IOrganizationUseCases {
  createOrganizationUseCase: CreateOrganizationUseCase;
  listUserOrganizationsUseCase: ListUserOrganizationsUseCase;
  getOrganizationUseCase: GetOrganizationUseCase;
  renameOrganizationUseCase: RenameOrganizationUseCase;
}

export class OrganizationController {
  constructor(private readonly useCases: IOrganizationUseCases) {}

  public async Create(
    body: unknown,
    actor: IActorContext
  ): Promise<HttpResult<IOrganizationResponse>> {
    const input = createOrganizationSchema.parse(body);

    const organization =
      await this.useCases.createOrganizationUseCase.Execute({
        ...input,
        actorId: actor.actorId,
        requestId: actor.requestId,
      });

    return created(toOrganizationResponse(organization));
  }

  public async List(
    actor: IActorContext
  ): Promise<HttpResult<IOrganizationResponse[]>> {
    const organizations =
      await this.useCases.listUserOrganizationsUseCase.Execute(actor.actorId);

    return ok(toOrganizationResponseList(organizations));
  }

  public async Get(
    params: unknown,
    actor: IActorContext
  ): Promise<HttpResult<IOrganizationDetailResponse>> {
    const { slug } = organizationParamsSchema.parse(params);

    const { organization, role } =
      await this.useCases.getOrganizationUseCase.Execute({
        slug,
        actorId: actor.actorId,
      });

    return ok(toOrganizationDetailResponse(organization, role));
  }

  public async Rename(
    params: unknown,
    body: unknown,
    actor: IActorContext
  ): Promise<HttpResult<IOrganizationResponse>> {
    const { slug } = organizationParamsSchema.parse(params);
    const { name } = renameOrganizationSchema.parse(body);

    const organization =
      await this.useCases.renameOrganizationUseCase.Execute({
        slug,
        name,
        actorId: actor.actorId,
        requestId: actor.requestId,
      });

    return ok(toOrganizationResponse(organization));
  }
}
