import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PlainPassword } from "../../src/core/entities";
import { ScryptPasswordHasher } from "../../src/infrastructure/adapters/security";

describe("ScryptPasswordHasher", () => {
  const hasher = new ScryptPasswordHasher();
  const password = PlainPassword.Create("senha-forte-123");

  it("gera hash verificável", async () => {
    assert.equal(await hasher.verify(password, await hasher.hash(password)), true);
  });

  it("recusa senha errada", async () => {
    const stored = await hasher.hash(password);

    assert.equal(
      await hasher.verify(PlainPassword.Create("outra-senha-99"), stored),
      false
    );
  });

  it("usa salt por usuário: mesma senha, hashes diferentes", async () => {
    const [a, b] = await Promise.all([hasher.hash(password), hasher.hash(password)]);

    assert.notEqual(a, b);
    assert.equal(await hasher.verify(password, a), true);
    assert.equal(await hasher.verify(password, b), true);
  });

  it("grava os parâmetros de custo no próprio hash", async () => {
    const [algorithm, N, r, p] = (await hasher.hash(password)).split("$");

    assert.equal(algorithm, "scrypt");
    assert.equal(Number(N), 32768);
    assert.equal(Number(r), 8);
    assert.equal(Number(p), 1);
  });

  it("devolve false em vez de explodir com hash corrompido no banco", async () => {
    for (const corrupted of ["", "lixo", "scrypt$1", "bcrypt$1$2$3$4$5", "scrypt$0$8$1$c2Fs$aGFzaA=="]) {
      assert.equal(await hasher.verify(password, corrupted), false, `estourou em "${corrupted}"`);
    }
  });

  it("hashThatNeverMatches é estável e jamais confere", async () => {
    assert.equal(hasher.hashThatNeverMatches(), hasher.hashThatNeverMatches());
    assert.equal(
      await hasher.verify(password, hasher.hashThatNeverMatches()),
      false
    );
  });
});
