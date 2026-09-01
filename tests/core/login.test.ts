import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { InvalidCredentials } from "../../src/core/exceptions";
import { CreateUserUseCase, LoginUseCase } from "../../src/core/use-cases";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import {
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  SequentialIdGenerator,
} from "../support/fakes";

describe("LoginUseCase", () => {
  let repository: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let useCase: LoginUseCase;

  const credentials = { email: "esdras@example.com", password: "senha-forte-123" };

  beforeEach(async () => {
    repository = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();

    await new CreateUserUseCase(
      repository,
      hasher,
      new SequentialIdGenerator(),
      new FixedClock()
    ).Execute({ name: "Esdras", ...credentials });

    useCase = new LoginUseCase(repository, hasher, new FakeTokenService());
  });

  it("devolve token e usuário com credenciais válidas", async () => {
    const { token, user } = await useCase.Execute(credentials);

    assert.equal(token, "token:id-1:esdras@example.com");
    assert.equal(user.Email.Value, credentials.email);
  });

  it("rejeita senha errada", async () => {
    await assert.rejects(
      () => useCase.Execute({ ...credentials, password: "outra-senha-99" }),
      InvalidCredentials
    );
  });

  it("rejeita e-mail inexistente com a mesma mensagem da senha errada", async () => {
    const semUsuario = await useCase
      .Execute({ email: "ninguem@example.com", password: credentials.password })
      .catch((error: Error) => error.message);

    const senhaErrada = await useCase
      .Execute({ ...credentials, password: "outra-senha-99" })
      .catch((error: Error) => error.message);

    assert.equal(semUsuario, senhaErrada);
  });

  it("gasta um verify mesmo sem usuário, para não vazar quais e-mails existem", async () => {
    const antes = hasher.verifyCalls;

    await useCase.Execute({ email: "ninguem@example.com", password: credentials.password }).catch(() => {});

    assert.equal(hasher.verifyCalls, antes + 1);
  });

  it("trata entrada malformada como credencial inválida, não como erro de validação", async () => {
    for (const input of [
      { email: "nao-e-email", password: credentials.password },
      { email: credentials.email, password: "curta" },
      { email: undefined, password: undefined },
    ]) {
      await assert.rejects(() => useCase.Execute(input), InvalidCredentials);
    }
  });
});
