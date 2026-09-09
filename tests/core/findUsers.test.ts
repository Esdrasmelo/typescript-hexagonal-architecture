import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { EventRecorder } from "../../src/core/events";
import { ResourceNotFound } from "../../src/core/exceptions";
import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
} from "../../src/core/use-cases";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import {
  FakePasswordHasher,
  FixedClock,
  RecordingEventPublisher,
  SequentialIdGenerator,
  SilentLogger,
} from "../support/fakes";

describe("Consulta de usuários", () => {
  let repository: InMemoryUserRepository;
  let create: CreateUserUseCase;
  let findAll: FindAllUsersUseCase;
  let findByEmail: FindUserByEmailUseCase;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    create = new CreateUserUseCase(
      repository,
      new FakePasswordHasher(),
      new SequentialIdGenerator(),
      new FixedClock(),
      new EventRecorder(
        new RecordingEventPublisher(),
        new SequentialIdGenerator(),
        new FixedClock(),
        new SilentLogger()
      )
    );
    findAll = new FindAllUsersUseCase(repository);
    findByEmail = new FindUserByEmailUseCase(repository);
  });

  it("devolve lista vazia quando não há usuários, em vez de 'não encontrado'", async () => {
    assert.deepEqual(await findAll.Execute(), []);
  });

  it("devolve todos os usuários cadastrados", async () => {
    await create.Execute({ name: "A", email: "a@example.com", password: "senha12345" });
    await create.Execute({ name: "B", email: "b@example.com", password: "senha12345" });

    assert.equal((await findAll.Execute()).length, 2);
  });

  it("encontra por e-mail independente da caixa", async () => {
    await create.Execute({ name: "A", email: "a@example.com", password: "senha12345" });

    assert.equal((await findByEmail.Execute("A@EXAMPLE.COM")).Name, "A");
  });

  it("busca em lote ignora ids desconhecidos", async () => {
    const user = await create.Execute({
      name: "A",
      email: "a@example.com",
      password: "senha12345",
    });

    const found = await repository.findManyByIds([user.Id, "inexistente"]);

    assert.deepEqual(
      found.map((each) => each.Id),
      [user.Id]
    );
  });

  it("lança ResourceNotFound quando o e-mail não existe", async () => {
    await assert.rejects(() => findByEmail.Execute("ninguem@example.com"), ResourceNotFound);
  });
});
