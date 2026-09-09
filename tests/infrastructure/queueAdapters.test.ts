import { Queue } from "bullmq";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IDomainEvent } from "../../src/core/events";
import {
  BullMqEventPublisher,
  BullMqNotificationScheduler,
  decodeDomainEvent,
  encodeDomainEvent,
  IDomainEventPayload,
} from "../../src/infrastructure/adapters/queue";

const ACCEPTED_JOB_ID = /^[A-Za-z0-9_-]+$/;

interface IRecordedJob {
  name: string;
  data: unknown;
  jobId?: string;
}

const spyQueue = (): { queue: Queue; jobs: IRecordedJob[] } => {
  const jobs: IRecordedJob[] = [];

  const queue = {
    add: async (
      name: string,
      data: unknown,
      options?: { jobId?: string }
    ): Promise<void> => {
      jobs.push({ name, data, jobId: options?.jobId });
    },
  } as unknown as Queue;

  return { queue, jobs };
};

const event: IDomainEvent = {
  id: "3f2b1c88-9a4d-4f6e-9d2a-77c0b1e4a512",
  name: "membership.granted",
  occurredAt: new Date("2026-01-01T12:00:00.000Z"),
  resource: { type: "membership", id: "mem-1" },
  actorId: "user-1",
  organizationId: "org-1",
  requestId: "req-1",
  metadata: { role: "admin", userId: "user-2" },
};

describe("Codec de eventos de domínio", () => {
  it("sobrevive à ida e volta pela fila, que só carrega JSON", () => {
    const restored = decodeDomainEvent(
      JSON.parse(JSON.stringify(encodeDomainEvent(event))) as IDomainEventPayload
    );

    assert.deepEqual(restored, event);
  });

  it("recompõe metadados ausentes como objeto vazio", () => {
    const payload = encodeDomainEvent(event);

    delete (payload as Partial<IDomainEventPayload>).metadata;

    assert.deepEqual(decodeDomainEvent(payload).metadata, {});
  });
});

describe("Publicação na fila", () => {
  it("usa o id do evento como id do job, o que descarta republicação", async () => {
    const { queue, jobs } = spyQueue();

    await new BullMqEventPublisher(queue).publish(event);

    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].jobId, event.id);
    assert.match(String(jobs[0].jobId), ACCEPTED_JOB_ID);
  });

  it("agenda a notificação com id de job aceito pelo BullMQ", async () => {
    const { queue, jobs } = spyQueue();

    await new BullMqNotificationScheduler(queue).schedule("notif-1");

    assert.deepEqual(jobs[0].data, { notificationId: "notif-1" });
    assert.match(String(jobs[0].jobId), ACCEPTED_JOB_ID);
  });
});
