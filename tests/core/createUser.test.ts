import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Email, PlainPassword } from "../../src/core/entities";
import { DataAlreadyExists, EmailIsNotValid, PasswordIsTooShort } from "../../src/core/exceptions";
import { CreateUserUseCase } from "../../src/core/use-cases";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import { FakePasswordHasher, FixedClock, SequentialIdGenerator } from "../support/fakes";

describe("CreateUserUseCase", () => {
  let repository: InMemoryUserRepository;
  let useCase: CreateUserUseCase;

  const input = {
    name: "Esdras",
    email: "esdras@example.com",
    password: "senha-forte-123",
  };

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    useCase = new CreateUserUseCase(
      repository,
      new FakePasswordHasher(),
      new SequentialIdGenerator(),
      new FixedClock()
    );
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
    const withSpy = new CreateUserUseCase(
      repository,
      hasher,
      new SequentialIdGenerator(),
      new FixedClock()
    );

    const user = await withSpy.Execute(input);

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
  });

  it("persiste de forma recuperável pelo e-mail", async () => {
    await useCase.Execute(input);

    const found = await repository.findByEmail(Email.Create(input.email));

    assert.equal(found?.Name, "Esdras");
  });
});
