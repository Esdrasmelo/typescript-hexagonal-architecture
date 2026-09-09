import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Email, MembershipRole, PlainPassword, Slug } from "../../src/core/entities";
import {
  EmailIsNotValid,
  MembershipRoleIsNotValid,
  NonProvidedField,
  PasswordIsTooLong,
  PasswordIsTooShort,
  SlugIsNotValid,
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

describe("Slug", () => {
  it("aceita o formato canônico", () => {
    assert.equal(Slug.Create("banda-do-ze").Value, "banda-do-ze");
  });

  it("normaliza caixa e espaços das pontas", () => {
    assert.equal(Slug.Create("  Banda-Do-Ze  ").Value, "banda-do-ze");
  });

  it("deriva slug de texto livre, sem acento e sem pontuação", () => {
    assert.equal(Slug.FromText("Banda do Zé & Amigos!").Value, "banda-do-ze-amigos");
  });

  it("rejeita formatos inválidos", () => {
    for (const invalid of ["ab", "-comeca-com-hifen", "termina-", "com espaço", "acento-é", "a".repeat(49)]) {
      assert.throws(() => Slug.Create(invalid), SlugIsNotValid, `aceitou "${invalid}"`);
    }
  });

  it("rejeita valor ausente ou de outro tipo", () => {
    for (const invalid of [undefined, null, "", "   ", 42, {}]) {
      assert.throws(() => Slug.Create(invalid), NonProvidedField);
    }
  });

  it("compara por valor", () => {
    assert.ok(Slug.Create("banda").Equals(Slug.Create("BANDA")));
  });
});

describe("MembershipRole", () => {
  it("reconhece os três papéis, ignorando caixa", () => {
    assert.equal(MembershipRole.Create("OWNER"), MembershipRole.Owner);
    assert.equal(MembershipRole.Create("admin"), MembershipRole.Admin);
    assert.equal(MembershipRole.Create(" member "), MembershipRole.Member);
  });

  it("rejeita papel desconhecido", () => {
    assert.throws(() => MembershipRole.Create("chefe"), MembershipRoleIsNotValid);
  });

  it("rejeita valor ausente", () => {
    assert.throws(() => MembershipRole.Create(undefined), NonProvidedField);
  });

  it("só deixa owner e admin gerenciarem membros", () => {
    assert.equal(MembershipRole.Owner.CanManageMembers, true);
    assert.equal(MembershipRole.Admin.CanManageMembers, true);
    assert.equal(MembershipRole.Member.CanManageMembers, false);
  });

  it("ordena por hierarquia", () => {
    assert.ok(MembershipRole.Owner.OutranksOrEquals(MembershipRole.Admin));
    assert.ok(MembershipRole.Admin.OutranksOrEquals(MembershipRole.Admin));
    assert.equal(MembershipRole.Admin.OutranksOrEquals(MembershipRole.Owner), false);
  });
});
