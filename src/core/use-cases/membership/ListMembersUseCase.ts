import { UserEntity } from "../../entities";
import { IMembershipRepositoryPort, IUserRepositoryPort } from "../../ports";
import { OrganizationAccess } from "../../services";
import { IUseCase } from "../UseCase";
import { IMemberView } from "./AddMemberUseCase";

export interface IListMembersInput {
  slug: unknown;
  actorId: string;
}

export class ListMembersUseCase
  implements IUseCase<IListMembersInput, IMemberView[]>
{
  constructor(
    private readonly organizationAccess: OrganizationAccess,
    private readonly membershipRepository: IMembershipRepositoryPort,
    private readonly userRepository: IUserRepositoryPort
  ) {}

  public async Execute(input: IListMembersInput): Promise<IMemberView[]> {
    const { organization } = await this.organizationAccess.Resolve(
      input.slug,
      input.actorId
    );

    const memberships = await this.membershipRepository.findByOrganization(
      organization.Id
    );

    const usersById = await this.MapUsersById(
      memberships.map((membership) => membership.UserId)
    );

    return memberships
      .flatMap((membership) => {
        const user = usersById.get(membership.UserId);

        return user ? [{ membership, user }] : [];
      })
      .sort(
        (first, second) =>
          second.membership.Role.Rank - first.membership.Role.Rank ||
          first.user.Name.localeCompare(second.user.Name)
      );
  }

  private async MapUsersById(
    userIds: readonly string[]
  ): Promise<Map<string, UserEntity>> {
    const users = await this.userRepository.findManyByIds(userIds);

    return new Map(users.map((user) => [user.Id, user]));
  }
}
