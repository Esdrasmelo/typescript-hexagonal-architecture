import {
  ListAuditEventsUseCase,
  ListUserNotificationsUseCase,
} from "../../../../../core/use-cases";
import {
  IAuditEventResponse,
  INotificationResponse,
  toAuditEventResponseList,
  toNotificationResponseList,
} from "../presenters/activityPresenter";
import { HttpResult, IActorContext, ok } from "../protocols";
import {
  listAuditEventsQuerySchema,
  listNotificationsQuerySchema,
  organizationParamsSchema,
} from "../schemas";

export interface IActivityUseCases {
  listAuditEventsUseCase: ListAuditEventsUseCase;
  listUserNotificationsUseCase: ListUserNotificationsUseCase;
}

export class ActivityController {
  constructor(private readonly useCases: IActivityUseCases) {}

  public async ListAuditEvents(
    params: unknown,
    query: unknown,
    actor: IActorContext
  ): Promise<HttpResult<IAuditEventResponse[]>> {
    const { slug } = organizationParamsSchema.parse(params);
    const filters = listAuditEventsQuerySchema.parse(query);

    const events = await this.useCases.listAuditEventsUseCase.Execute({
      slug,
      actorId: actor.actorId,
      limit: filters.limit,
      name: filters.event,
      performedBy: filters.actor,
      occurredBefore: filters.before,
    });

    return ok(toAuditEventResponseList(events));
  }

  public async ListMyNotifications(
    query: unknown,
    actor: IActorContext
  ): Promise<HttpResult<INotificationResponse[]>> {
    const { limit } = listNotificationsQuerySchema.parse(query);

    const notifications =
      await this.useCases.listUserNotificationsUseCase.Execute({
        recipientId: actor.actorId,
        limit,
      });

    return ok(toNotificationResponseList(notifications));
  }
}
