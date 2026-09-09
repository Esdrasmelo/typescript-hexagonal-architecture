import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadEnv } from "../../src/infrastructure/config/env";
import { loadTestEnv, testEnvSource } from "../support/testEnv";

const withoutKey = (key: string): NodeJS.ProcessEnv => {
  const source = { ...testEnvSource };

  delete source[key];

  return source;
};

describe("loadEnv", () => {
  it("aplica defaults sensatos", () => {
    const env = loadTestEnv();

    assert.equal(env.APP_PORT, 3000);
    assert.equal(env.JWT_EXPIRES_IN, "1d");
    assert.equal(env.LOG_LEVEL, "info");
    assert.equal(env.MONGO_DATABASE, "hexagonal");
    assert.equal(env.CACHE_TTL_SECONDS, 60);
    assert.equal(env.QUEUE_JOB_ATTEMPTS, 5);
    assert.equal(env.QUEUE_BACKOFF_MILLISECONDS, 1000);
    assert.equal(env.AUDIT_RETENTION_DAYS, 180);
  });

  it("falha na subida quando falta uma dependência obrigatória", () => {
    for (const key of ["DATABASE_URL", "REDIS_URL", "MONGO_URL", "JWT_SECRET"]) {
      assert.throws(
        () => loadEnv(withoutKey(key)),
        new RegExp(key),
        `subiu sem ${key}`
      );
    }
  });

  it("recusa JWT_SECRET curto demais para ser levado a sério", () => {
    assert.throws(() => loadTestEnv({ JWT_SECRET: "123" }), /JWT_SECRET/);
  });

  it("recusa URL de Redis com esquema errado", () => {
    assert.throws(
      () => loadTestEnv({ REDIS_URL: "http://localhost:6379" }),
      /REDIS_URL/
    );
  });

  it("recusa URL de Mongo com esquema errado", () => {
    assert.throws(
      () => loadTestEnv({ MONGO_URL: "postgres://localhost:27017" }),
      /MONGO_URL/
    );
  });

  it("aceita rediss:// e mongodb+srv://, usados em serviço gerenciado", () => {
    const env = loadTestEnv({
      REDIS_URL: "rediss://cache.interno:6380",
      MONGO_URL: "mongodb+srv://cluster.interno",
    });

    assert.equal(env.REDIS_URL, "rediss://cache.interno:6380");
    assert.equal(env.MONGO_URL, "mongodb+srv://cluster.interno");
  });

  it("converte números vindos como texto", () => {
    const env = loadTestEnv({ APP_PORT: "8080", QUEUE_CONCURRENCY: "12" });

    assert.equal(env.APP_PORT, 8080);
    assert.equal(env.QUEUE_CONCURRENCY, 12);
  });

  it("recusa nível de log desconhecido", () => {
    assert.throws(() => loadTestEnv({ LOG_LEVEL: "verbose" }), /LOG_LEVEL/);
  });
});
