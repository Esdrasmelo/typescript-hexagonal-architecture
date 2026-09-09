import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { buildTestApp, ITestApp } from "../support/buildTestApp";

const LOCALHOST = "http://127.0.0.1";
const PASSWORD = "senha-forte-123";

describe("API de organizações", () => {
  let server: Server;
  let baseUrl: string;
  let context: ITestApp;
  let ownerToken: string;
  let memberToken: string;
  let memberId: string;

  const api = (path: string, init?: RequestInit) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });

  const json = async <T = Record<string, any>>(response: Response): Promise<T> =>
    (await response.json()) as T;

  const asOwner = (): Record<string, string> => ({
    authorization: `Bearer ${ownerToken}`,
  });

  const asMember = (): Record<string, string> => ({
    authorization: `Bearer ${memberToken}`,
  });

  const register = async (name: string, email: string): Promise<string> => {
    const response = await api("/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password: PASSWORD }),
    });

    return (await json<{ id: string }>(response)).id;
  };

  const login = async (email: string): Promise<string> => {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: PASSWORD }),
    });

    return (await json<{ token: string }>(response)).token;
  };

  before(async () => {
    context = buildTestApp();

    await new Promise<void>((resolve) => {
      server = context.app.listen(0, () => resolve());
    });

    baseUrl = `${LOCALHOST}:${(server.address() as AddressInfo).port}`;

    await register("Esdras", "esdras@example.com");
    memberId = await register("Zelia", "zelia@example.com");

    ownerToken = await login("esdras@example.com");
    memberToken = await login("zelia@example.com");

    await api("/organizations", {
      method: "POST",
      headers: asOwner(),
      body: JSON.stringify({ name: "Banda do Zé" }),
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("POST /organizations exige autenticação", async () => {
    const response = await api("/organizations", {
      method: "POST",
      body: JSON.stringify({ name: "Sem token" }),
    });

    assert.equal(response.status, 401);
  });

  it("GET /organizations lista as organizações do usuário autenticado", async () => {
    const response = await api("/organizations", { headers: asOwner() });

    assert.equal(response.status, 200);

    const body = await json<Record<string, any>[]>(response);

    assert.deepEqual(
      body.map((organization) => organization.slug),
      ["banda-do-ze"]
    );
  });

  it("GET /organizations/:slug devolve 404 para quem não é membro", async () => {
    const response = await api("/organizations/banda-do-ze", {
      headers: asMember(),
    });

    assert.equal(response.status, 404);
  });

  it("POST /organizations repetido responde 409", async () => {
    const response = await api("/organizations", {
      method: "POST",
      headers: asOwner(),
      body: JSON.stringify({ name: "Banda do Ze" }),
    });

    assert.equal(response.status, 409);
  });

  it("POST /organizations/:slug/members adiciona por e-mail", async () => {
    const response = await api("/organizations/banda-do-ze/members", {
      method: "POST",
      headers: asOwner(),
      body: JSON.stringify({ email: "zelia@example.com" }),
    });

    assert.equal(response.status, 201);

    const body = await json(response);

    assert.equal(body.user_id, memberId);
    assert.equal(body.role, "member");
  });

  it("o convite gera notificação para quem entrou", async () => {
    const response = await api("/me/notifications", { headers: asMember() });
    const notifications = await json<Record<string, any>[]>(response);

    assert.ok(
      notifications.some((notification) =>
        String(notification.subject).includes("Banda do Zé")
      )
    );
  });

  it("GET /organizations/:slug agora responde ao novo membro, com o papel dele", async () => {
    const response = await api("/organizations/banda-do-ze", {
      headers: asMember(),
    });

    assert.equal(response.status, 200);
    assert.equal((await json(response)).role, "member");
  });

  it("GET /organizations/:slug/members lista quem está dentro", async () => {
    const response = await api("/organizations/banda-do-ze/members", {
      headers: asMember(),
    });

    assert.equal(response.status, 200);

    const body = await json<Record<string, any>[]>(response);

    assert.deepEqual(
      body.map((member) => member.role),
      ["owner", "member"]
    );
    assert.equal("password" in body[0], false);
  });

  it("membro comum não renomeia a organização", async () => {
    const response = await api("/organizations/banda-do-ze", {
      method: "PATCH",
      headers: asMember(),
      body: JSON.stringify({ name: "Nome do Membro" }),
    });

    assert.equal(response.status, 403);
    assert.equal((await json(response)).error.code, "FORBIDDEN");
  });

  it("membro comum não lê a auditoria", async () => {
    const response = await api("/organizations/banda-do-ze/audit-events", {
      headers: asMember(),
    });

    assert.equal(response.status, 403);
  });

  it("PATCH /organizations/:slug renomeia para quem administra", async () => {
    const response = await api("/organizations/banda-do-ze", {
      method: "PATCH",
      headers: asOwner(),
      body: JSON.stringify({ name: "Banda do Zé e Amigos" }),
    });

    assert.equal(response.status, 200);
    assert.equal((await json(response)).name, "Banda do Zé e Amigos");
  });

  it("PATCH nos membros promove a admin", async () => {
    const response = await api(
      `/organizations/banda-do-ze/members/${memberId}`,
      {
        method: "PATCH",
        headers: asOwner(),
        body: JSON.stringify({ role: "admin" }),
      }
    );

    assert.equal(response.status, 200);
    assert.equal((await json(response)).role, "admin");
  });

  it("PATCH nos membros recusa papel fora da lista", async () => {
    const response = await api(
      `/organizations/banda-do-ze/members/${memberId}`,
      {
        method: "PATCH",
        headers: asOwner(),
        body: JSON.stringify({ role: "chefe" }),
      }
    );

    assert.equal(response.status, 400);
  });

  it("GET /organizations/:slug/audit-events mostra o rastro para o admin", async () => {
    const response = await api(
      "/organizations/banda-do-ze/audit-events?limit=50",
      { headers: asOwner() }
    );

    assert.equal(response.status, 200);

    const body = await json<Record<string, any>[]>(response);
    const nomes = body.map((event) => event.event);

    assert.ok(nomes.includes("organization.created"));
    assert.ok(nomes.includes("membership.granted"));
    assert.ok(nomes.includes("organization.renamed"));
  });

  it("GET /organizations/:slug/audit-events filtra por tipo", async () => {
    const response = await api(
      "/organizations/banda-do-ze/audit-events?event=membership.granted",
      { headers: asOwner() }
    );

    const body = await json<Record<string, any>[]>(response);

    assert.equal(
      body.every((event) => event.event === "membership.granted"),
      true
    );
  });

  it("GET /organizations/:slug/audit-events recusa filtro inventado", async () => {
    const response = await api(
      "/organizations/banda-do-ze/audit-events?event=coisa.inventada",
      { headers: asOwner() }
    );

    assert.equal(response.status, 400);
  });

  it("DELETE nos membros remove e responde 204", async () => {
    const response = await api(
      `/organizations/banda-do-ze/members/${memberId}`,
      { method: "DELETE", headers: asOwner() }
    );

    assert.equal(response.status, 204);

    const members = await api("/organizations/banda-do-ze/members", {
      headers: asOwner(),
    });

    assert.equal((await json<Record<string, any>[]>(members)).length, 1);
  });

  it("DELETE do último proprietário responde 409", async () => {
    const owner = await api("/organizations/banda-do-ze/members", {
      headers: asOwner(),
    });

    const [{ user_id: ownerId }] = await json<Record<string, any>[]>(owner);

    const response = await api(
      `/organizations/banda-do-ze/members/${ownerId}`,
      { method: "DELETE", headers: asOwner() }
    );

    assert.equal(response.status, 409);
  });
});
