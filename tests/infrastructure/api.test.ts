import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { buildTestApp, ITestApp } from "../support/buildTestApp";

const LOCALHOST = "http://127.0.0.1";

describe("API HTTP", () => {
  let server: Server;
  let baseUrl: string;
  let context: ITestApp;

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

  const login = async (): Promise<string> => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    return (await json<{ token: string }>(response)).token;
  };

  const authenticate = async (): Promise<string> => `Bearer ${await login()}`;

  before(async () => {
    context = buildTestApp();

    await new Promise<void>((resolve) => {
      server = context.app.listen(0, () => resolve());
    });

    baseUrl = `${LOCALHOST}:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("GET /health responde sem autenticação", async () => {
    assert.equal((await api("/health")).status, 200);
  });

  it("GET /health/ready reporta cada dependência", async () => {
    const response = await api("/health/ready");

    assert.equal(response.status, 200);

    const body = await json(response);

    assert.equal(body.status, "ok");
    assert.equal(body.dependencies.memoria, "ok");
  });

  it("devolve o x-request-id recebido, para correlacionar log e auditoria", async () => {
    const response = await api("/health", {
      headers: { "x-request-id": "req-de-fora" },
    });

    assert.equal(response.headers.get("x-request-id"), "req-de-fora");
  });

  it("gera um x-request-id quando o cliente não manda", async () => {
    const response = await api("/health");

    assert.ok(response.headers.get("x-request-id"));
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

  it("o cadastro dispara a notificação de boas-vindas pelo pipeline de eventos", async () => {
    const response = await api("/me/notifications", {
      headers: { authorization: await authenticate() },
    });

    assert.equal(response.status, 200);

    const [notification] = await json<Record<string, any>[]>(response);

    assert.equal(notification.subject, "Sua conta está pronta");
    assert.equal(notification.status, "delivered");
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

  it("POST /auth/login devolve token e validade com credenciais válidas", async () => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    assert.equal(response.status, 200);

    const body = await json(response);

    assert.equal(typeof body.token, "string");
    assert.ok(Date.parse(body.expires_at) > Date.now());
    assert.equal("password" in body.user, false);
  });

  it("POST /auth/login responde 401 para senha errada", async () => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...credentials, password: "errada-12345" }),
    });

    assert.equal(response.status, 401);
  });

  it("POST /auth/logout invalida o token, mesmo que ele ainda não tenha vencido", async () => {
    const token = await login();
    const authorization = `Bearer ${token}`;

    assert.equal((await api("/users", { headers: { authorization } })).status, 200);

    const logout = await api("/auth/logout", {
      method: "POST",
      headers: { authorization },
    });

    assert.equal(logout.status, 204);
    assert.equal((await api("/users", { headers: { authorization } })).status, 401);
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
