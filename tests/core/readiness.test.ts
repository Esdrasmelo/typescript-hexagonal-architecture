import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IHealthProbePort } from "../../src/core/ports";
import { CheckReadinessUseCase } from "../../src/core/use-cases";

const TIMEOUT_IN_MILLISECONDS = 50;

const healthy = (name: string): IHealthProbePort => ({
  name,
  check: async (): Promise<void> => undefined,
});

const broken = (name: string, reason: string): IHealthProbePort => ({
  name,
  check: async (): Promise<void> => {
    throw new Error(reason);
  },
});

const slow = (name: string): IHealthProbePort => ({
  name,
  check: (): Promise<void> =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, TIMEOUT_IN_MILLISECONDS * 10);

      timer.unref();
    }),
});

describe("CheckReadinessUseCase", () => {
  it("aprova quando todas as dependências respondem", async () => {
    const report = await new CheckReadinessUseCase(
      [healthy("mysql"), healthy("redis"), healthy("mongodb")],
      TIMEOUT_IN_MILLISECONDS
    ).Execute();

    assert.equal(report.healthy, true);
    assert.equal(report.dependencies.length, 3);
  });

  it("reprova apontando qual dependência caiu, sem derrubar as outras", async () => {
    const report = await new CheckReadinessUseCase(
      [healthy("mysql"), broken("redis", "conexão recusada")],
      TIMEOUT_IN_MILLISECONDS
    ).Execute();

    assert.equal(report.healthy, false);
    assert.deepEqual(
      report.dependencies.map((dependency) => dependency.healthy),
      [true, false]
    );
    assert.equal(report.dependencies[1].reason, "conexão recusada");
  });

  it("não fica pendurado em dependência que nunca responde", async () => {
    const report = await new CheckReadinessUseCase(
      [slow("mongodb")],
      TIMEOUT_IN_MILLISECONDS
    ).Execute();

    assert.equal(report.healthy, false);
    assert.match(String(report.dependencies[0].reason), /tempo de resposta/);
  });
});
