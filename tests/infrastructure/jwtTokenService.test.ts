import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvalidToken } from "../../src/core/exceptions";
import { JwtTokenService } from "../../src/infrastructure/adapters/security";
import { CryptoIdGenerator } from "../../src/infrastructure/adapters/system";

const SECRET = "segredo-de-teste-com-mais-de-32-caracteres";

const makeService = (expiresIn = "1h"): JwtTokenService =>
  new JwtTokenService(SECRET, expiresIn, new CryptoIdGenerator());

describe("JwtTokenService", () => {
  const service = makeService();
  const payload = { sub: "id-1", email: "esdras@example.com" };

  it("assina e verifica o próprio token", () => {
    const issued = service.sign(payload);
    const verified = service.verify(issued.token);

    assert.equal(verified.sub, payload.sub);
    assert.equal(verified.email, payload.email);
    assert.equal(verified.id, issued.id);
  });

  it("dá um identificador único a cada token, que é o que a revogação usa", () => {
    assert.notEqual(service.sign(payload).id, service.sign(payload).id);
  });

  it("informa o vencimento, para a revogação expirar sozinha", () => {
    const issued = service.sign(payload);

    assert.ok(issued.expiresAt.getTime() > Date.now());
    assert.equal(
      service.verify(issued.token).expiresAt.getTime(),
      issued.expiresAt.getTime()
    );
  });

  it("rejeita token assinado com outro segredo", () => {
    const outro = new JwtTokenService(
      "outro-segredo-com-mais-de-32-caracteres",
      "1h",
      new CryptoIdGenerator()
    );

    assert.throws(() => service.verify(outro.sign(payload).token), InvalidToken);
  });

  it("rejeita token expirado", () => {
    const expirado = makeService("-1s");

    assert.throws(() => service.verify(expirado.sign(payload).token), InvalidToken);
  });

  it("rejeita algoritmo 'none' — o ataque clássico de JWT", () => {
    const forjado = jwt.sign({ email: payload.email }, "", {
      algorithm: "none",
      subject: payload.sub,
      jwtid: "jti-forjado",
      expiresIn: "1h",
    });

    assert.throws(() => service.verify(forjado), InvalidToken);
  });

  it("rejeita token bem assinado mas sem os campos esperados", () => {
    assert.throws(() => service.verify(jwt.sign({ foo: "bar" }, SECRET)), InvalidToken);
  });

  it("rejeita token sem jti, que não poderia ser revogado", () => {
    const semJti = jwt.sign({ email: payload.email }, SECRET, {
      subject: payload.sub,
      expiresIn: "1h",
    });

    assert.throws(() => service.verify(semJti), InvalidToken);
  });

  it("rejeita lixo", () => {
    for (const garbage of ["", "abc", "a.b.c"]) {
      assert.throws(() => service.verify(garbage), InvalidToken);
    }
  });
});
