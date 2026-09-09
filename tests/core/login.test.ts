import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { EventRecorder } from "../../src/core/events";
import { InvalidCredentials } from "../../src/core/exceptions";
import {
  CreateUserUseCase,
  LoginUseCase,
  LogoutUseCase,
} from "../../src/core/use-cases";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import {
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  InMemoryRevokedTokenStore,
  RecordingEventPublisher,
  SequentialIdGenerator,
  SilentLogger,
} from "../support/fakes";

describe("LoginUseCase", () => {
  let repository: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let publisher: RecordingEventPublisher;
  let useCase: LoginUseCase;

  const credentials = { email: "esdras@example.com", password: "senha-forte-123" };

  const makeEventRecorder = (
    events: RecordingEventPublisher
  ): EventRecorder =>
    new EventRecorder(
      events,
      new SequentialIdGenerator(),
      new FixedClock(),
      new SilentLogger()
    );

  beforeEach(async () => {
    repository = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    publisher = new RecordingEventPublisher();

    await new CreateUserUseCase(
      repository,
      hasher,
      new SequentialIdGenerator(),
      new FixedClock(),
      makeEventRecorder(new RecordingEventPublisher())
    ).Execute({ name: "Esdras", ...credentials });

    useCase = new LoginUseCase(
      repository,
      hasher,
      new FakeTokenService(),
      makeEventRecorder(publisher)
    );
  });

  it("devolve token, validade e usuário com credenciais válidas", async () => {
    const { token, expiresAt, user } = await useCase.Execute(credentials);

    assert.equal(token, "token:id-1:esdras@example.com:jti-1");
    assert.ok(expiresAt.getTime() > Date.now());
    assert.equal(user.Email.Value, credentials.email);
  });

  it("registra o acesso como evento de domínio", async () => {
    await useCase.Execute(credentials);

    assert.deepEqual(publisher.Names(), ["user.logged-in"]);
    assert.equal(publisher.Last()?.metadata.tokenId, "jti-1");
  });

  it("rejeita senha errada", async () => {
    await assert.rejects(
      () => useCase.Execute({ ...credentials, password: "outra-senha-99" }),
      InvalidCredentials
    );

    assert.deepEqual(publisher.Names(), []);
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

describe("LogoutUseCase", () => {
  it("revoga o token até o vencimento e registra a saída", async () => {
    const store = new InMemoryRevokedTokenStore();
    const publisher = new RecordingEventPublisher();
    const expiresAt = new Date(Date.now() + 60_000);

    await new LogoutUseCase(
      store,
      new EventRecorder(
        publisher,
        new SequentialIdGenerator(),
        new FixedClock(),
        new SilentLogger()
      )
    ).Execute({ actorId: "user-1", tokenId: "jti-1", expiresAt });

    assert.equal(await store.isRevoked("jti-1"), true);
    assert.equal(await store.isRevoked("jti-2"), false);
    assert.deepEqual(publisher.Names(), ["user.logged-out"]);
  });

  it("ignora token já vencido, que não precisa ocupar espaço", async () => {
    const store = new InMemoryRevokedTokenStore();

    await new LogoutUseCase(
      store,
      new EventRecorder(
        new RecordingEventPublisher(),
        new SequentialIdGenerator(),
        new FixedClock(),
        new SilentLogger()
      )
    ).Execute({
      actorId: "user-1",
      tokenId: "jti-vencido",
      expiresAt: new Date(Date.now() - 1000),
    });

    assert.equal(await store.isRevoked("jti-vencido"), false);
  });
});
