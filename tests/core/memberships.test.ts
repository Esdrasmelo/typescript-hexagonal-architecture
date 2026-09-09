import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { UserEntity } from "../../src/core/entities";
import {
  DataAlreadyExists,
  ForbiddenAction,
  MembershipRoleIsNotValid,
  OrganizationNeedsAnOwner,
  ResourceNotFound,
} from "../../src/core/exceptions";
import { buildWorkspace, IWorkspace } from "../support/buildWorkspace";

const SLUG = "banda-do-ze";

describe("Membros da organização", () => {
  let workspace: IWorkspace;
  let owner: UserEntity;
  let convidado: UserEntity;

  beforeEach(async () => {
    workspace = buildWorkspace();
    owner = await workspace.createUser("Esdras", "esdras@example.com");
    convidado = await workspace.createUser("Convidado", "convidado@example.com");

    await workspace.createOrganization.Execute({
      name: "Banda do Zé",
      actorId: owner.Id,
    });
  });

  const addMember = (email: string, role?: string, actorId = owner.Id) =>
    workspace.addMember.Execute({ slug: SLUG, email, role, actorId });

  it("adiciona membro com papel padrão de member", async () => {
    const { membership, user } = await addMember("convidado@example.com");

    assert.equal(user.Id, convidado.Id);
    assert.equal(membership.Role.Value, "member");
    assert.equal(membership.InvitedBy, owner.Id);
  });

  it("recusa e-mail que não tem conta na aplicação", async () => {
    await assert.rejects(
      () => addMember("ninguem@example.com"),
      ResourceNotFound
    );
  });

  it("recusa o mesmo usuário duas vezes", async () => {
    await addMember("convidado@example.com");

    await assert.rejects(
      () => addMember("convidado@example.com"),
      DataAlreadyExists
    );
  });

  it("recusa papel inexistente", async () => {
    await assert.rejects(
      () => addMember("convidado@example.com", "chefe"),
      MembershipRoleIsNotValid
    );
  });

  it("impede admin de nomear alguém acima do próprio papel", async () => {
    await addMember("convidado@example.com", "admin");

    await workspace.createUser("Terceiro", "terceiro@example.com");

    await assert.rejects(
      () => addMember("terceiro@example.com", "owner", convidado.Id),
      ForbiddenAction
    );
  });

  it("impede membro comum de convidar", async () => {
    await addMember("convidado@example.com");
    await workspace.createUser("Terceiro", "terceiro@example.com");

    await assert.rejects(
      () => addMember("terceiro@example.com", undefined, convidado.Id),
      ForbiddenAction
    );
  });

  it("anuncia a entrada com os dados que a notificação usa", async () => {
    await addMember("convidado@example.com", "admin");

    const event = workspace.publisher.Last();

    assert.equal(event?.name, "membership.granted");
    assert.equal(event?.metadata.userId, convidado.Id);
    assert.equal(event?.metadata.organization, "Banda do Zé");
    assert.equal(event?.metadata.role, "admin");
  });

  it("lista membros do mais graduado para o menos graduado", async () => {
    await addMember("convidado@example.com", "admin");
    await workspace.createUser("Zelia", "zelia@example.com");
    await addMember("zelia@example.com");

    const membros = await workspace.listMembers.Execute({
      slug: SLUG,
      actorId: owner.Id,
    });

    assert.deepEqual(
      membros.map((membro) => membro.membership.Role.Value),
      ["owner", "admin", "member"]
    );
  });

  it("promove membro a admin", async () => {
    await addMember("convidado@example.com");

    const updated = await workspace.changeMemberRole.Execute({
      slug: SLUG,
      userId: convidado.Id,
      role: "admin",
      actorId: owner.Id,
    });

    assert.equal(updated.Role.Value, "admin");
    assert.equal(workspace.publisher.Last()?.name, "membership.role-changed");
  });

  it("é idempotente quando o papel já é o pedido", async () => {
    await addMember("convidado@example.com", "admin");
    const antes = workspace.publisher.published.length;

    const updated = await workspace.changeMemberRole.Execute({
      slug: SLUG,
      userId: convidado.Id,
      role: "admin",
      actorId: owner.Id,
    });

    assert.equal(updated.Role.Value, "admin");
    assert.equal(workspace.publisher.published.length, antes);
  });

  it("impede admin de mexer no papel de um proprietário", async () => {
    await addMember("convidado@example.com", "admin");

    await assert.rejects(
      () =>
        workspace.changeMemberRole.Execute({
          slug: SLUG,
          userId: owner.Id,
          role: "member",
          actorId: convidado.Id,
        }),
      ForbiddenAction
    );
  });

  it("não deixa a organização ficar sem proprietário ao rebaixar o último", async () => {
    await assert.rejects(
      () =>
        workspace.changeMemberRole.Execute({
          slug: SLUG,
          userId: owner.Id,
          role: "member",
          actorId: owner.Id,
        }),
      OrganizationNeedsAnOwner
    );
  });

  it("aceita rebaixar um proprietário quando existe outro", async () => {
    await addMember("convidado@example.com", "owner");

    const updated = await workspace.changeMemberRole.Execute({
      slug: SLUG,
      userId: convidado.Id,
      role: "admin",
      actorId: owner.Id,
    });

    assert.equal(updated.Role.Value, "admin");
  });

  it("remove membro e libera o cache dele", async () => {
    await addMember("convidado@example.com");
    await workspace.listOrganizations.Execute(convidado.Id);

    await workspace.removeMember.Execute({
      slug: SLUG,
      userId: convidado.Id,
      actorId: owner.Id,
    });

    assert.equal(
      await workspace.memberships.findByOrganizationAndUser(
        (await workspace.organizations.findAllForMember(owner.Id))[0].Id,
        convidado.Id
      ),
      null
    );
    assert.deepEqual(await workspace.listOrganizations.Execute(convidado.Id), []);
    assert.equal(workspace.publisher.Last()?.name, "membership.revoked");
  });

  it("não deixa remover o último proprietário", async () => {
    await assert.rejects(
      () =>
        workspace.removeMember.Execute({
          slug: SLUG,
          userId: owner.Id,
          actorId: owner.Id,
        }),
      OrganizationNeedsAnOwner
    );
  });

  it("recusa remoção de quem não está na organização", async () => {
    await assert.rejects(
      () =>
        workspace.removeMember.Execute({
          slug: SLUG,
          userId: convidado.Id,
          actorId: owner.Id,
        }),
      ResourceNotFound
    );
  });
});
