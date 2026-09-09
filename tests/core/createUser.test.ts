import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Email, PlainPassword } from "../../src/core/entities";
import { EventRecorder } from "../../src/core/events";
import { DataAlreadyExists, EmailIsNotValid, PasswordIsTooShort } from "../../src/core/exceptions";
import { CreateUserUseCase } from "../../src/core/use-cases";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import {
  BrokenEventPublisher,
  FakePasswordHasher,
  FixedClock,
  RecordingEventPublisher,
  SequentialIdGenerator,
  SilentLogger,
} from "../support/fakes";

describe("CreateUserUseCase", () => {
  let repository: InMemoryUserRepository;
  let publisher: RecordingEventPublisher;
  let useCase: CreateUserUseCase;

  const input = {
    name: "Esdras",
    email: "esdras@example.com",
    password: "senha-forte-123",
  };

  const makeUseCase = (
    events: RecordingEventPublisher | BrokenEventPublisher,
    hasher = new FakePasswordHasher()
  ): CreateUserUseCase =>
    new CreateUserUseCase(
      repository,
      hasher,
      new SequentialIdGenerator(),
      new FixedClock(),
      new EventRecorder(
        events,
        new SequentialIdGenerator(),
        new FixedClock(),
        new SilentLogger()
      )
    );

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    publisher = new RecordingEventPublisher();
    useCase = makeUseCase(publisher);
  });

  it("cria o usuário com id, timestamps e senha em hash", async () => {
    const user = await useCase.Execute(input);

    assert.equal(user.Id, "id-1");
    assert.equal(user.Name, "Esdras");
    assert.equal(user.Email.Value, "esdras@example.com");
    assert.equal(user.CreatedAt.toISOString(), "2026-01-01T12:00:00.000Z");
    assert.equal(user.PasswordHash, "hashed:senha-forte-123");
  });

  it("passa a senha pela porta de hashing em vez de persistir o texto puro", async () => {
    const hasher = new FakePasswordHasher();
    const user = await makeUseCase(publisher, hasher).Execute(input);

    assert.notEqual(user.PasswordHash, input.password);
    assert.equal(user.PasswordHash, await hasher.hash(PlainPassword.Create(input.password)));
  });

  it("recusa e-mail já cadastrado, ignorando diferença de caixa", async () => {
    await useCase.Execute(input);

    await assert.rejects(
      () => useCase.Execute({ ...input, email: "ESDRAS@example.com" }),
      DataAlreadyExists
    );

    assert.equal((await repository.findAll()).length, 1);
  });

  it("valida e-mail e senha antes de tocar no repositório", async () => {
    await assert.rejects(() => useCase.Execute({ ...input, email: "invalido" }), EmailIsNotValid);
    await assert.rejects(() => useCase.Execute({ ...input, password: "curta" }), PasswordIsTooShort);

    assert.equal((await repository.findAll()).length, 0);
    assert.deepEqual(publisher.Names(), []);
  });

  it("persiste de forma recuperável pelo e-mail", async () => {
    await useCase.Execute(input);

    const found = await repository.findByEmail(Email.Create(input.email));

    assert.equal(found?.Name, "Esdras");
  });

  it("anuncia o cadastro para quem escuta eventos de domínio", async () => {
    const user = await useCase.Execute({ ...input, requestId: "req-1" });
    const event = publisher.Last();

    assert.equal(event?.name, "user.registered");
    assert.deepEqual(event?.resource, { type: "user", id: user.Id });
    assert.equal(event?.requestId, "req-1");
    assert.equal(event?.metadata.name, "Esdras");
  });

  it("conclui o cadastro mesmo com a fila de eventos fora do ar", async () => {
    const user = await makeUseCase(new BrokenEventPublisher()).Execute(input);

    assert.equal((await repository.findById(user.Id))?.Id, user.Id);
  });
});
