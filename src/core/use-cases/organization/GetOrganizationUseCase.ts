import { MembershipRole, OrganizationEntity } from "../../entities";
import { OrganizationAccess } from "../../services";
import { IUseCase } from "../UseCase";

export interface IGetOrganizationInput {
  slug: unknown;
  actorId: string;
}

export interface IOrganizationWithRole {
  organization: OrganizationEntity;
  role: MembershipRole;
}

export class GetOrganizationUseCase
  implements IUseCase<IGetOrganizationInput, IOrganizationWithRole>
{
  constructor(private readonly organizationAccess: OrganizationAccess) {}

  public async Execute(
    input: IGetOrganizationInput
  ): Promise<IOrganizationWithRole> {
    const { organization, membership } = await this.organizationAccess.Resolve(
      input.slug,
      input.actorId
    );

    return { organization, role: membership.Role };
  }
}
