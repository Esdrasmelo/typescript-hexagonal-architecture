import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { UserEntity } from "../../src/core/entities";
import {
  DataAlreadyExists,
  ForbiddenAction,
  ResourceNotFound,
  SlugIsNotValid,
} from "../../src/core/exceptions";
import { buildWorkspace, IWorkspace } from "../support/buildWorkspace";

describe("Organizações", () => {
  let workspace: IWorkspace;
  let owner: UserEntity;

  beforeEach(async () => {
    workspace = buildWorkspace();
    owner = await workspace.createUser("Esdras", "esdras@example.com");
  });

  const createOrganization = (name: string, slug?: string) =>
    workspace.createOrganization.Execute({
      name,
      slug,
      actorId: owner.Id,
      requestId: "req-1",
    });

  it("cria a organização com slug derivado do nome", async () => {
    const organization = await createOrganization("Banda do Zé");

    assert.equal(organization.Name, "Banda do Zé");
    assert.equal(organization.Slug.Value, "banda-do-ze");
    assert.equal(organization.OwnerId, owner.Id);
  });

  it("dá ao criador a associação de proprietário", async () => {
    const organization = await createOrganization("Banda do Zé");

    const membership = await workspace.memberships.findByOrganizationAndUser(
      organization.Id,
      owner.Id
    );

    assert.equal(membership?.Role.Value, "owner");
    assert.equal(membership?.InvitedBy, null);
  });

  it("recusa slug já usado por outra organização", async () => {
    await createOrganization("Banda do Zé");

    await assert.rejects(
      () => createOrganization("Banda do Ze"),
      DataAlreadyExists
    );
  });

  it("recusa slug informado fora do formato", async () => {
    await assert.rejects(
      () => createOrganization("Banda", "Slug Inválido"),
      SlugIsNotValid
    );
  });

  it("anuncia a criação com organização e slug nos metadados", async () => {
    const organization = await createOrganization("Banda do Zé");
    const event = workspace.publisher.Last();

    assert.equal(event?.name, "organization.created");
    assert.equal(event?.organizationId, organization.Id);
    assert.equal(event?.metadata.slug, "banda-do-ze");
  });

  it("lista somente as organizações onde o usuário é membro", async () => {
    const outro = await workspace.createUser("Outro", "outro@example.com");

    await createOrganization("Banda do Zé");
    await workspace.createOrganization.Execute({
      name: "Outra Banda",
      actorId: outro.Id,
    });

    const minhas = await workspace.listOrganizations.Execute(owner.Id);

    assert.deepEqual(
      minhas.map((organization) => organization.Slug.Value),
      ["banda-do-ze"]
    );
  });

  it("serve a segunda listagem pelo cache, sem voltar ao banco", async () => {
    await createOrganization("Banda do Zé");

    const primeira = await workspace.listOrganizations.Execute(owner.Id);
    const segunda = await workspace.listOrganizations.Execute(owner.Id);

    assert.deepEqual(
      segunda.map((organization) => organization.Snapshot()),
      primeira.map((organization) => organization.Snapshot())
    );
    assert.equal(workspace.cache.writes, 1);
    assert.equal(workspace.cache.reads, 2);
  });

  it("invalida o cache do usuário quando ele entra em outra organização", async () => {
    await createOrganization("Banda do Zé");
    await workspace.listOrganizations.Execute(owner.Id);

    await workspace.createOrganization.Execute({
      name: "Segunda Banda",
      actorId: owner.Id,
    });

    const organizacoes = await workspace.listOrganizations.Execute(owner.Id);

    assert.equal(organizacoes.length, 2);
  });

  it("esconde a organização de quem não é membro, respondendo não encontrado", async () => {
    await createOrganization("Banda do Zé");
    const estranho = await workspace.createUser("Estranho", "estranho@example.com");

    await assert.rejects(
      () =>
        workspace.getOrganization.Execute({
          slug: "banda-do-ze",
          actorId: estranho.Id,
        }),
      ResourceNotFound
    );
  });

  it("devolve o papel do usuário junto da organização", async () => {
    await createOrganization("Banda do Zé");

    const { organization, role } = await workspace.getOrganization.Execute({
      slug: "banda-do-ze",
      actorId: owner.Id,
    });

    assert.equal(organization.Name, "Banda do Zé");
    assert.equal(role.Value, "owner");
  });

  it("renomeia mantendo o slug, que é o identificador público", async () => {
    await createOrganization("Banda do Zé");

    const renamed = await workspace.renameOrganization.Execute({
      slug: "banda-do-ze",
      name: "Banda do Zé e Amigos",
      actorId: owner.Id,
    });

    assert.equal(renamed.Name, "Banda do Zé e Amigos");
    assert.equal(renamed.Slug.Value, "banda-do-ze");
  });

  it("recusa renomeação feita por membro comum", async () => {
    await createOrganization("Banda do Zé");
    const membro = await workspace.createUser("Membro", "membro@example.com");

    await workspace.addMember.Execute({
      slug: "banda-do-ze",
      email: "membro@example.com",
      actorId: owner.Id,
    });

    await assert.rejects(
      () =>
        workspace.renameOrganization.Execute({
          slug: "banda-do-ze",
          name: "Nome Novo",
          actorId: membro.Id,
        }),
      ForbiddenAction
    );
  });

  it("derruba o cache de todos os membros ao renomear", async () => {
    await createOrganization("Banda do Zé");
    await workspace.createUser("Membro", "membro@example.com");

    const { user: membro } = await workspace.addMember.Execute({
      slug: "banda-do-ze",
      email: "membro@example.com",
      actorId: owner.Id,
    });

    await workspace.listOrganizations.Execute(owner.Id);
    await workspace.listOrganizations.Execute(membro.Id);

    await workspace.renameOrganization.Execute({
      slug: "banda-do-ze",
      name: "Banda Nova",
      actorId: owner.Id,
    });

    assert.equal(workspace.cache.Size, 0);

    const [doMembro] = await workspace.listOrganizations.Execute(membro.Id);

    assert.equal(doMembro.Name, "Banda Nova");
  });
});
