import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
  LoginUseCase,
} from "../../src/core/use-cases";
import {
  AuthController,
  UserController,
} from "../../src/infrastructure/adapters/api/express/controllers";
import { createApp } from "../../src/infrastructure/adapters/api/express/server";
import { JwtTokenService } from "../../src/infrastructure/adapters/security";
import {
  CryptoIdGenerator,
  SystemClock,
} from "../../src/infrastructure/adapters/system";
import { loadEnv } from "../../src/infrastructure/config/env";
import { InMemoryUserRepository } from "../support/InMemoryUserRepository";
import { FakePasswordHasher } from "../support/fakes";

const LOCALHOST = "http://127.0.0.1";

describe("API HTTP", () => {
  let server: Server;
  let baseUrl: string;

  const credentials = {
    email: "esdras@example.com",
    password: "senha-forte-123",
  };

  const api = (path: string, init?: RequestInit) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });

  const json = async <T = Record<string, any>>(response: Response): Promise<T> =>
    (await response.json()) as T;

  const authenticate = async (): Promise<string> => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    return `Bearer ${(await json<{ token: string }>(response)).token}`;
  };

  before(async () => {
    const env = loadEnv({
      NODE_ENV: "test",
      DATABASE_URL: "mysql://user:pass@localhost:3306/test",
      JWT_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
    } as NodeJS.ProcessEnv);

    const repository = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

    const app = createApp({
      env,
      tokenService,
      userController: new UserController({
        createUserUseCase: new CreateUserUseCase(
          repository,
          hasher,
          new CryptoIdGenerator(),
          new SystemClock()
        ),
        findAllUsersUseCase: new FindAllUsersUseCase(repository),
        findUserByEmailUseCase: new FindUserByEmailUseCase(repository),
      }),
      authController: new AuthController(
        new LoginUseCase(repository, hasher, tokenService)
      ),
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });

    baseUrl = `${LOCALHOST}:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("GET /health responde sem autenticação", async () => {
    assert.equal((await api("/health")).status, 200);
  });

  it("POST /users é público e devolve 201 sem expor a senha", async () => {
    const response = await api("/users", {
      method: "POST",
      body: JSON.stringify({ name: "Esdras", ...credentials }),
    });

    assert.equal(response.status, 201);

    const body = await json(response);

    assert.equal(body.email, credentials.email);
    assert.equal("password" in body, false);
    assert.equal("passwordHash" in body, false);
  });

  it("POST /users recusa e-mail duplicado com 409", async () => {
    const response = await api("/users", {
      method: "POST",
      body: JSON.stringify({ name: "Outro", ...credentials }),
    });

    assert.equal(response.status, 409);
    assert.equal((await json(response)).error.code, "CONFLICT");
  });

  it("POST /users recusa payload malformado com 400", async () => {
    const response = await api("/users", {
      method: "POST",
      body: JSON.stringify({
        name: "X",
        email: { $ne: null },
        password: "senha12345",
      }),
    });

    assert.equal(response.status, 400);
  });

  it("GET /users sem token responde 401 uma única vez", async () => {
    const response = await api("/users");

    assert.equal(response.status, 401);
    assert.equal((await json(response)).error.code, "UNAUTHORIZED");
  });

  it("GET /users com Authorization malformado responde 401", async () => {
    for (const header of ["abc", "Basic xyz", "Bearer", "Bearer lixo"]) {
      const response = await api("/users", { headers: { authorization: header } });

      assert.equal(response.status, 401, `passou com "${header}"`);
    }
  });

  it("POST /auth/login devolve token com credenciais válidas", async () => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    assert.equal(response.status, 200);

    const body = await json(response);

    assert.equal(typeof body.token, "string");
    assert.equal("password" in body.user, false);
  });

  it("POST /auth/login responde 401 para senha errada", async () => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...credentials, password: "errada-12345" }),
    });

    assert.equal(response.status, 401);
  });

  it("GET /users autenticado lista usuários sem senha", async () => {
    const response = await api("/users", {
      headers: { authorization: await authenticate() },
    });

    assert.equal(response.status, 200);

    const body = await json<Record<string, any>[]>(response);

    assert.ok(Array.isArray(body));
    assert.equal(body.length, 1);
    assert.equal("password" in body[0], false);
  });

  it("GET /users?email= filtra o resultado", async () => {
    const response = await api(
      `/users?email=${encodeURIComponent(credentials.email)}`,
      { headers: { authorization: await authenticate() } }
    );

    assert.equal(response.status, 200);
    assert.equal((await json(response)).email, credentials.email);
  });

  it("GET /users?email= responde 404 quando o e-mail não existe", async () => {
    const response = await api("/users?email=ninguem@example.com", {
      headers: { authorization: await authenticate() },
    });

    assert.equal(response.status, 404);
  });

  it("rota inexistente responde 404 em JSON", async () => {
    const response = await api("/nao-existe");

    assert.equal(response.status, 404);
    assert.equal((await json(response)).error.code, "NOT_FOUND");
  });
});
