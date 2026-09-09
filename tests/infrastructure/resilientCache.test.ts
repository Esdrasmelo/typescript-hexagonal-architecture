import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ResilientCache } from "../../src/infrastructure/adapters/cache";
import { BrokenCache, InMemoryCache, SilentLogger } from "../support/fakes";

describe("ResilientCache", () => {
  it("entrega o valor guardado quando o cache responde", async () => {
    const cache = new ResilientCache(new InMemoryCache(), new SilentLogger());

    await cache.set("chave", { total: 2 }, 60);

    assert.deepEqual(await cache.get("chave"), { total: 2 });
  });

  it("responde como cache vazio quando o Redis está fora, em vez de estourar", async () => {
    const logger = new SilentLogger();
    const cache = new ResilientCache(new BrokenCache(), logger);

    assert.equal(await cache.get("chave"), null);

    assert.equal(
      logger.lines.filter((line) => line.level === "warn").length,
      1
    );
  });

  it("engole falha de escrita e de remoção", async () => {
    const cache = new ResilientCache(new BrokenCache(), new SilentLogger());

    await cache.set("chave", "valor", 60);
    await cache.delete("chave");
  });
});
