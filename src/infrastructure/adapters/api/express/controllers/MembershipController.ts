import {
  AddMemberUseCase,
  ChangeMemberRoleUseCase,
  ListMembersUseCase,
  RemoveMemberUseCase,
} from "../../../../../core/use-cases";
import {
  IMemberResponse,
  toMemberResponse,
  toMemberResponseList,
} from "../presenters/organizationPresenter";
import {
  created,
  HttpResult,
  IActorContext,
  noContent,
  ok,
} from "../protocols";
import {
  addMemberSchema,
  changeMemberRoleSchema,
  memberParamsSchema,
  organizationParamsSchema,
} from "../schemas";

export interface IMembershipUseCases {
  addMemberUseCase: AddMemberUseCase;
  listMembersUseCase: ListMembersUseCase;
  changeMemberRoleUseCase: ChangeMemberRoleUseCase;
  removeMemberUseCase: RemoveMemberUseCase;
}

export class MembershipController {
  constructor(private readonly useCases: IMembershipUseCases) {}

  public async Add(
    params: unknown,
    body: unknown,
    actor: IActorContext
  ): Promise<HttpResult<IMemberResponse>> {
    const { slug } = organizationParamsSchema.parse(params);
    const input = addMemberSchema.parse(body);

    const member = await this.useCases.addMemberUseCase.Execute({
      ...input,
      slug,
      actorId: actor.actorId,
      requestId: actor.requestId,
    });

    return created(toMemberResponse(member));
  }

  public async List(
    params: unknown,
    actor: IActorContext
  ): Promise<HttpResult<IMemberResponse[]>> {
    const { slug } = organizationParamsSchema.parse(params);

    const members = await this.useCases.listMembersUseCase.Execute({
      slug,
      actorId: actor.actorId,
    });

    return ok(toMemberResponseList(members));
  }

  public async ChangeRole(
    params: unknown,
    body: unknown,
    actor: IActorContext
  ): Promise<HttpResult<{ user_id: string; role: string }>> {
    const { slug, userId } = memberParamsSchema.parse(params);
    const { role } = changeMemberRoleSchema.parse(body);

    const membership = await this.useCases.changeMemberRoleUseCase.Execute({
      slug,
      userId,
      role,
      actorId: actor.actorId,
      requestId: actor.requestId,
    });

    return ok({ user_id: membership.UserId, role: membership.Role.Value });
  }

  public async Remove(
    params: unknown,
    actor: IActorContext
  ): Promise<HttpResult<null>> {
    const { slug, userId } = memberParamsSchema.parse(params);

    await this.useCases.removeMemberUseCase.Execute({
      slug,
      userId,
      actorId: actor.actorId,
      requestId: actor.requestId,
    });

    return noContent();
  }
}
