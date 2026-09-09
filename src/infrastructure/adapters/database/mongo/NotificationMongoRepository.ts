import { Collection, Db } from "mongodb";
import {
  Email,
  NotificationEntity,
  NotificationStatus,
} from "../../../../core/entities";
import { INotificationRepositoryPort } from "../../../../core/ports";
import { COLLECTIONS } from "./mongoClient";

interface INotificationDocument {
  _id: string;
  recipientId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  attempts: number;
  lastFailureReason: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type NotificationFields = Omit<INotificationDocument, "_id">;

export class NotificationMongoRepository
  implements INotificationRepositoryPort
{
  private readonly collection: Collection<INotificationDocument>;

  constructor(database: Db) {
    this.collection = database.collection<INotificationDocument>(
      COLLECTIONS.notifications
    );
  }

  public async findById(
    notificationId: string
  ): Promise<NotificationEntity | null> {
    const document = await this.collection.findOne({ _id: notificationId });

    return document
      ? NotificationMongoRepository.ToEntity(document)
      : null;
  }

  public async findByRecipient(
    recipientId: string,
    limit: number
  ): Promise<NotificationEntity[]> {
    const documents = await this.collection
      .find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return documents.map(NotificationMongoRepository.ToEntity);
  }

  public async save(
    notification: NotificationEntity
  ): Promise<NotificationEntity> {
    await this.collection.updateOne(
      { _id: notification.Id },
      { $set: NotificationMongoRepository.ToFields(notification) },
      { upsert: true }
    );

    return notification;
  }

  private static ToFields(
    notification: NotificationEntity
  ): NotificationFields {
    return {
      recipientId: notification.RecipientId,
      recipientEmail: notification.RecipientEmail.Value,
      subject: notification.Subject,
      body: notification.Body,
      status: notification.Status,
      attempts: notification.Attempts,
      lastFailureReason: notification.LastFailureReason,
      deliveredAt: notification.DeliveredAt,
      createdAt: notification.CreatedAt,
      updatedAt: notification.UpdatedAt,
    };
  }

  private static ToEntity(
    document: INotificationDocument
  ): NotificationEntity {
    return NotificationEntity.Restore({
      id: document._id,
      recipientId: document.recipientId,
      recipientEmail: Email.Create(document.recipientEmail),
      subject: document.subject,
      body: document.body,
      status: document.status,
      attempts: document.attempts,
      lastFailureReason: document.lastFailureReason,
      deliveredAt: document.deliveredAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
