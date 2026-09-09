import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Email, NotificationEntity, UserEntity } from "../../src/core/entities";
import { IDomainEvent, IDomainEventDraft } from "../../src/core/events";
import { ResourceNotFound } from "../../src/core/exceptions";
import { NotificationPolicy } from "../../src/core/services";
import {
  DispatchNotificationUseCase,
  HandleDomainEventUseCase,
  ListUserNotificationsUseCase,
} from "../../src/core/use-cases";
import {
  InMemoryAuditEventRepository,
  InMemoryNotificationRepository,
} from "../support/InMemoryDocumentStores";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import {
  FixedClock,
  RecordingNotificationScheduler,
  RecordingNotificationSender,
  SilentLogger,
} from "../support/fakes";

const makeEvent = (draft: IDomainEventDraft, id = "evt-1"): IDomainEvent => ({
  id,
  name: draft.name,
  occurredAt: new Date("2026-01-01T12:00:00.000Z"),
  resource: draft.resource,
  actorId: draft.actorId ?? null,
  organizationId: draft.organizationId ?? null,
  requestId: draft.requestId ?? null,
  metadata: draft.metadata ?? {},
});

describe("HandleDomainEventUseCase", () => {
  let users: InMemoryUserRepository;
  let notifications: InMemoryNotificationRepository;
  let auditEvents: InMemoryAuditEventRepository;
  let scheduler: RecordingNotificationScheduler;
  let useCase: HandleDomainEventUseCase;
  let recipient: UserEntity;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    notifications = new InMemoryNotificationRepository();
    auditEvents = new InMemoryAuditEventRepository();
    scheduler = new RecordingNotificationScheduler();

    recipient = UserEntity.Create({
      id: "user-1",
      name: "Esdras",
      email: Email.Create("esdras@example.com"),
      passwordHash: "hashed:qualquer",
      now: new Date("2026-01-01T12:00:00.000Z"),
    });

    await users.create(recipient);

    useCase = new HandleDomainEventUseCase(
      auditEvents,
      notifications,
      scheduler,
      users,
      new NotificationPolicy(),
      new FixedClock(),
      new SilentLogger()
    );
  });

  const registered = (id = "evt-1"): IDomainEvent =>
    makeEvent(
      {
        name: "user.registered",
        resource: { type: "user", id: recipient.Id },
        actorId: recipient.Id,
        metadata: { name: recipient.Name },
      },
      id
    );

  it("grava toda ocorrência na auditoria", async () => {
    await useCase.Execute(
      makeEvent({
        name: "organization.renamed",
        resource: { type: "organization", id: "org-1" },
        organizationId: "org-1",
        metadata: { from: "A", to: "B" },
      })
    );

    const [audited] = auditEvents.All;

    assert.equal(audited.Name, "organization.renamed");
    assert.equal(audited.OrganizationId, "org-1");
    assert.deepEqual(audited.Metadata, { from: "A", to: "B" });
  });

  it("cria e agenda a notificação de boas-vindas", async () => {
    await useCase.Execute(registered());

    const [notification] = await notifications.findByRecipient(
      recipient.Id,
      10
    );

    assert.equal(notification.Status, "pending");
    assert.equal(notification.RecipientEmail.Value, "esdras@example.com");
    assert.match(notification.Body, /Esdras/);
    assert.deepEqual(scheduler.scheduled, [notification.Id]);
  });

  it("não gera notificação para evento que não merece uma", async () => {
    await useCase.Execute(
      makeEvent({
        name: "user.logged-in",
        resource: { type: "user", id: recipient.Id },
        actorId: recipient.Id,
      })
    );

    assert.deepEqual(scheduler.scheduled, []);
    assert.equal(auditEvents.All.length, 1);
  });

  it("reprocessar o mesmo evento não duplica auditoria nem notificação", async () => {
    await useCase.Execute(registered());
    await useCase.Execute(registered());

    assert.equal(auditEvents.All.length, 1);
    assert.equal((await notifications.findByRecipient(recipient.Id, 10)).length, 1);
  });

  it("descarta a notificação quando o destinatário não existe mais", async () => {
    await useCase.Execute(
      makeEvent({
        name: "membership.granted",
        resource: { type: "membership", id: "mem-1" },
        organizationId: "org-1",
        metadata: { userId: "fantasma", organization: "Banda", role: "member" },
      })
    );

    assert.deepEqual(scheduler.scheduled, []);
    assert.equal(auditEvents.All.length, 1);
  });
});

describe("DispatchNotificationUseCase", () => {
  let notifications: InMemoryNotificationRepository;
  let sender: RecordingNotificationSender;
  let useCase: DispatchNotificationUseCase;

  const pending = NotificationEntity.Create({
    id: "notif-1",
    recipientId: "user-1",
    recipientEmail: Email.Create("esdras@example.com"),
    subject: "Sua conta está pronta",
    body: "Bem-vindo.",
    now: new Date("2026-01-01T12:00:00.000Z"),
  });

  beforeEach(async () => {
    notifications = new InMemoryNotificationRepository();
    sender = new RecordingNotificationSender();
    useCase = new DispatchNotificationUseCase(
      notifications,
      sender,
      new FixedClock(),
      new SilentLogger()
    );

    await notifications.save(pending);
  });

  it("entrega e marca como entregue", async () => {
    const delivered = await useCase.Execute("notif-1");

    assert.equal(delivered.Status, "delivered");
    assert.equal(delivered.Attempts, 1);
    assert.equal(delivered.DeliveredAt?.toISOString(), "2026-01-01T12:00:00.000Z");
    assert.equal(sender.sent.length, 1);
  });

  it("guarda o motivo da falha e devolve o erro para a fila tentar de novo", async () => {
    sender.failWith = new Error("provedor recusou");

    await assert.rejects(() => useCase.Execute("notif-1"), /provedor recusou/);

    const stored = await notifications.findById("notif-1");

    assert.equal(stored?.Status, "failed");
    assert.equal(stored?.Attempts, 1);
    assert.equal(stored?.LastFailureReason, "provedor recusou");
  });

  it("não entrega duas vezes quando o job repete", async () => {
    await useCase.Execute("notif-1");
    await useCase.Execute("notif-1");

    assert.equal(sender.sent.length, 1);
  });

  it("trata notificação inexistente como erro definitivo", async () => {
    await assert.rejects(() => useCase.Execute("nao-existe"), ResourceNotFound);
  });
});

describe("ListUserNotificationsUseCase", () => {
  it("devolve as mais recentes primeiro e respeita o teto de itens", async () => {
    const notifications = new InMemoryNotificationRepository();

    for (let index = 1; index <= 3; index += 1) {
      await notifications.save(
        NotificationEntity.Create({
          id: `notif-${index}`,
          recipientId: "user-1",
          recipientEmail: Email.Create("esdras@example.com"),
          subject: `Assunto ${index}`,
          body: "Corpo",
          now: new Date(`2026-01-0${index}T12:00:00.000Z`),
        })
      );
    }

    const useCase = new ListUserNotificationsUseCase(notifications);

    const primeiras = await useCase.Execute({
      recipientId: "user-1",
      limit: 2,
    });

    assert.deepEqual(
      primeiras.map((notification) => notification.Id),
      ["notif-3", "notif-2"]
    );
  });
});
