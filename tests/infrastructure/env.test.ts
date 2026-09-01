import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadEnv } from "../../src/infrastructure/config/env";

const base = {
  DATABASE_URL: "mysql://user:pass@localhost:3306/db",
  JWT_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
} as NodeJS.ProcessEnv;

describe("loadEnv", () => {
  it("aplica defaults sensatos", () => {
    const env = loadEnv(base);

    assert.equal(env.APP_PORT, 3000);
    assert.equal(env.NODE_ENV, "development");
    assert.equal(env.JWT_EXPIRES_IN, "1d");
  });

  it("falha na subida quando falta DATABASE_URL", () => {
    assert.throws(
      () => loadEnv({ JWT_SECRET: base.JWT_SECRET } as NodeJS.ProcessEnv),
      /DATABASE_URL/
    );
  });

  it("recusa JWT_SECRET curto demais para ser levado a sério", () => {
    assert.throws(
      () => loadEnv({ ...base, JWT_SECRET: "123" } as NodeJS.ProcessEnv),
      /JWT_SECRET/
    );
  });

  it("converte APP_PORT para número", () => {
    assert.equal(loadEnv({ ...base, APP_PORT: "8080" } as NodeJS.ProcessEnv).APP_PORT, 8080);
  });
});
