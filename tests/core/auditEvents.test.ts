import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AuditEventEntity, UserEntity } from "../../src/core/entities";
import { IDomainEvent } from "../../src/core/events";
import { ForbiddenAction } from "../../src/core/exceptions";
import { buildWorkspace, IWorkspace } from "../support/buildWorkspace";

const SLUG = "banda-do-ze";

describe("ListAuditEventsUseCase", () => {
  let workspace: IWorkspace;
  let owner: UserEntity;
  let organizationId: string;

  const append = async (event: IDomainEvent): Promise<void> => {
    await workspace.auditEvents.append(AuditEventEntity.FromEvent(event));
  };

  beforeEach(async () => {
    workspace = buildWorkspace();
    owner = await workspace.createUser("Esdras", "esdras@example.com");

    const organization = await workspace.createOrganization.Execute({
      name: "Banda do Zé",
      actorId: owner.Id,
    });

    organizationId = organization.Id;

    for (const event of workspace.publisher.published) {
      await append(event);
    }
  });

  it("devolve o rastro da organização para quem administra", async () => {
    const events = await workspace.listAuditEvents.Execute({
      slug: SLUG,
      actorId: owner.Id,
    });

    assert.deepEqual(
      events.map((event) => event.Name),
      ["organization.created"]
    );
  });

  it("filtra por tipo de evento", async () => {
    const events = await workspace.listAuditEvents.Execute({
      slug: SLUG,
      actorId: owner.Id,
      name: "membership.granted",
    });

    assert.deepEqual(events, []);
  });

  it("filtra por autor", async () => {
    const events = await workspace.listAuditEvents.Execute({
      slug: SLUG,
      actorId: owner.Id,
      performedBy: "outro-usuario",
    });

    assert.deepEqual(events, []);
  });

  it("nega o acesso a membro comum", async () => {
    const membro = await workspace.createUser("Membro", "membro@example.com");

    await workspace.addMember.Execute({
      slug: SLUG,
      email: "membro@example.com",
      actorId: owner.Id,
    });

    await assert.rejects(
      () =>
        workspace.listAuditEvents.Execute({ slug: SLUG, actorId: membro.Id }),
      ForbiddenAction
    );
  });

  it("não mistura o rastro de outra organização", async () => {
    const outro = await workspace.createUser("Outro", "outro@example.com");

    const outra = await workspace.createOrganization.Execute({
      name: "Outra Banda",
      actorId: outro.Id,
    });

    await append({
      id: "evt-externo",
      name: "organization.created",
      occurredAt: new Date(),
      resource: { type: "organization", id: outra.Id },
      actorId: outro.Id,
      organizationId: outra.Id,
      requestId: null,
      metadata: {},
    });

    const events = await workspace.listAuditEvents.Execute({
      slug: SLUG,
      actorId: owner.Id,
    });

    assert.equal(
      events.every((event) => event.OrganizationId === organizationId),
      true
    );
  });
});
