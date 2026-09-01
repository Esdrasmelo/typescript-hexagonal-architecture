import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Email, PlainPassword } from "../../src/core/entities";
import {
  EmailIsNotValid,
  NonProvidedField,
  PasswordIsTooLong,
  PasswordIsTooShort,
} from "../../src/core/exceptions";

describe("Email", () => {
  it("normaliza para minúsculo e remove espaços das pontas", () => {
    assert.equal(Email.Create("  Esdras@Example.COM  ").Value, "esdras@example.com");
  });

  it("rejeita formatos inválidos", () => {
    for (const invalid of ["sem-arroba", "a@b", "@example.com", "a@@b.com", "a b@c.com"]) {
      assert.throws(() => Email.Create(invalid), EmailIsNotValid, `aceitou "${invalid}"`);
    }
  });

  it("rejeita valor ausente ou de outro tipo", () => {
    for (const invalid of [undefined, null, "", "   ", 42, {}]) {
      assert.throws(() => Email.Create(invalid), NonProvidedField);
    }
  });

  it("compara por valor", () => {
    assert.ok(Email.Create("a@b.com").Equals(Email.Create("A@B.com")));
  });
});

describe("PlainPassword", () => {
  it("aceita senha dentro dos limites", () => {
    assert.equal(PlainPassword.Create("12345678").Value, "12345678");
  });

  it("rejeita senha curta demais", () => {
    assert.throws(() => PlainPassword.Create("1234567"), PasswordIsTooShort);
  });

  it("rejeita senha longa demais, que viraria DoS de hashing", () => {
    assert.throws(() => PlainPassword.Create("a".repeat(129)), PasswordIsTooLong);
  });

  it("nunca expõe o valor em log ou serialização", () => {
    const password = PlainPassword.Create("senha-secreta");

    assert.equal(String(password), "[REDACTED]");
    assert.equal(JSON.stringify({ password }), '{"password":"[REDACTED]"}');
  });
});
