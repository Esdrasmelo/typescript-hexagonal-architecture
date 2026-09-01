import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvalidToken } from "../../src/core/exceptions";
import { JwtTokenService } from "../../src/infrastructure/adapters/security";

const SECRET = "segredo-de-teste-com-mais-de-32-caracteres";

describe("JwtTokenService", () => {
  const service = new JwtTokenService(SECRET, "1h");
  const payload = { sub: "id-1", email: "esdras@example.com" };

  it("assina e verifica o próprio token", () => {
    assert.deepEqual(service.verify(service.sign(payload)), payload);
  });

  it("rejeita token assinado com outro segredo", () => {
    const outro = new JwtTokenService("outro-segredo-com-mais-de-32-caracteres", "1h");

    assert.throws(() => service.verify(outro.sign(payload)), InvalidToken);
  });

  it("rejeita token expirado", () => {
    const expirado = new JwtTokenService(SECRET, "-1s");

    assert.throws(() => service.verify(expirado.sign(payload)), InvalidToken);
  });

  it("rejeita algoritmo 'none' — o ataque clássico de JWT", () => {
    const forjado = jwt.sign({ email: payload.email }, "", {
      algorithm: "none",
      subject: payload.sub,
    });

    assert.throws(() => service.verify(forjado), InvalidToken);
  });

  it("rejeita token bem assinado mas sem os campos esperados", () => {
    assert.throws(() => service.verify(jwt.sign({ foo: "bar" }, SECRET)), InvalidToken);
  });

  it("rejeita lixo", () => {
    for (const garbage of ["", "abc", "a.b.c"]) {
      assert.throws(() => service.verify(garbage), InvalidToken);
    }
  });
});
