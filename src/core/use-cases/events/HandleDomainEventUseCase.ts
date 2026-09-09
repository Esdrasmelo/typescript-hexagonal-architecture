import { AuditEventEntity, NotificationEntity } from "../../entities";
import { IDomainEvent } from "../../events";
import {
  IAuditEventRepositoryPort,
  IClockPort,
  ILoggerPort,
  INotificationRepositoryPort,
  INotificationSchedulerPort,
  IUserRepositoryPort,
} from "../../ports";
import { INotificationDraft, NotificationPolicy } from "../../services";
import { IUseCase } from "../UseCase";

export class HandleDomainEventUseCase implements IUseCase<IDomainEvent, void> {
  constructor(
    private readonly auditEventRepository: IAuditEventRepositoryPort,
    private readonly notificationRepository: INotificationRepositoryPort,
    private readonly notificationScheduler: INotificationSchedulerPort,
    private readonly userRepository: IUserRepositoryPort,
    private readonly notificationPolicy: NotificationPolicy,
    private readonly clock: IClockPort,
    private readonly logger: ILoggerPort
  ) {}

  public async Execute(event: IDomainEvent): Promise<void> {
    await this.auditEventRepository.append(AuditEventEntity.FromEvent(event));

    const draft = this.notificationPolicy.DraftFor(event);

    if (!draft) return;

    await this.Notify(event, draft);
  }

  private async Notify(
    event: IDomainEvent,
    draft: INotificationDraft
  ): Promise<void> {
    const alreadyCreated = await this.notificationRepository.findById(event.id);

    if (alreadyCreated) {
      await this.notificationScheduler.schedule(alreadyCreated.Id);

      return;
    }

    const recipient = await this.userRepository.findById(draft.recipientId);

    if (!recipient) {
      this.logger.warn("Notificação descartada: destinatário não existe", {
        event: event.name,
        eventId: event.id,
        recipientId: draft.recipientId,
      });

      return;
    }

    const notification = await this.notificationRepository.save(
      NotificationEntity.Create({
        id: event.id,
        recipientId: recipient.Id,
        recipientEmail: recipient.Email,
        subject: draft.subject,
        body: draft.body,
        now: this.clock.now(),
      })
    );

    await this.notificationScheduler.schedule(notification.Id);
  }
}
