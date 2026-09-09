import { EventMetadata, IDomainEvent } from "../events/DomainEvent";

export interface INotificationDraft {
  recipientId: string;
  subject: string;
  body: string;
}

const readText = (metadata: EventMetadata, key: string): string => {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
};

export class NotificationPolicy {
  public DraftFor(event: IDomainEvent): INotificationDraft | null {
    switch (event.name) {
      case "user.registered":
        return this.Welcome(event);
      case "membership.granted":
        return this.MembershipGranted(event);
      default:
        return null;
    }
  }

  private Welcome(event: IDomainEvent): INotificationDraft | null {
    const name = readText(event.metadata, "name");

    if (!event.resource.id) return null;

    return {
      recipientId: event.resource.id,
      subject: "Sua conta está pronta",
      body: `${name || "Olá"}, sua conta foi criada. Crie uma organização para começar a convidar pessoas.`,
    };
  }

  private MembershipGranted(event: IDomainEvent): INotificationDraft | null {
    const recipientId = readText(event.metadata, "userId");

    if (!recipientId) return null;

    const organization = readText(event.metadata, "organization");
    const role = readText(event.metadata, "role");

    return {
      recipientId,
      subject: `Você entrou em ${organization}`,
      body: `Seu acesso a ${organization} foi liberado com o papel "${role}".`,
    };
  }
}
