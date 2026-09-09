import { FieldIsTooLong, NonProvidedField } from "../exceptions";
import { Email } from "./value-objects";

const MAX_SUBJECT_LENGTH = 160;
const MAX_BODY_LENGTH = 2000;
const MAX_FAILURE_REASON_LENGTH = 500;

export type NotificationStatus = "pending" | "delivered" | "failed";

export interface INotificationProps {
  id: string;
  recipientId: string;
  recipientEmail: Email;
  subject: string;
  body: string;
  status: NotificationStatus;
  attempts: number;
  lastFailureReason: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNotificationProps {
  id: string;
  recipientId: string;
  recipientEmail: Email;
  subject: string;
  body: string;
  now: Date;
}

export class NotificationEntity {
  private constructor(private readonly props: INotificationProps) {}

  public static Create(input: ICreateNotificationProps): NotificationEntity {
    if (!input.recipientId) throw new NonProvidedField("recipientId");

    return new NotificationEntity({
      id: input.id,
      recipientId: input.recipientId,
      recipientEmail: input.recipientEmail,
      subject: NotificationEntity.EnsureText(
        input.subject,
        "subject",
        MAX_SUBJECT_LENGTH
      ),
      body: NotificationEntity.EnsureText(input.body, "body", MAX_BODY_LENGTH),
      status: "pending",
      attempts: 0,
      lastFailureReason: null,
      deliveredAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static Restore(props: INotificationProps): NotificationEntity {
    return new NotificationEntity(props);
  }

  public MarkAsDelivered(now: Date): NotificationEntity {
    return new NotificationEntity({
      ...this.props,
      status: "delivered",
      attempts: this.props.attempts + 1,
      lastFailureReason: null,
      deliveredAt: now,
      updatedAt: now,
    });
  }

  public MarkAsFailed(reason: string, now: Date): NotificationEntity {
    return new NotificationEntity({
      ...this.props,
      status: "failed",
      attempts: this.props.attempts + 1,
      lastFailureReason: reason.slice(0, MAX_FAILURE_REASON_LENGTH),
      updatedAt: now,
    });
  }

  public get Id(): string {
    return this.props.id;
  }

  public get RecipientId(): string {
    return this.props.recipientId;
  }

  public get RecipientEmail(): Email {
    return this.props.recipientEmail;
  }

  public get Subject(): string {
    return this.props.subject;
  }

  public get Body(): string {
    return this.props.body;
  }

  public get Status(): NotificationStatus {
    return this.props.status;
  }

  public get Attempts(): number {
    return this.props.attempts;
  }

  public get LastFailureReason(): string | null {
    return this.props.lastFailureReason;
  }

  public get DeliveredAt(): Date | null {
    return this.props.deliveredAt;
  }

  public get CreatedAt(): Date {
    return this.props.createdAt;
  }

  public get UpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public get IsDelivered(): boolean {
    return this.props.status === "delivered";
  }

  private static EnsureText(
    value: string,
    field: string,
    maxLength: number
  ): string {
    const trimmed = typeof value === "string" ? value.trim() : "";

    if (!trimmed) throw new NonProvidedField(field);
    if (trimmed.length > maxLength) throw new FieldIsTooLong(field, maxLength);

    return trimmed;
  }
}
