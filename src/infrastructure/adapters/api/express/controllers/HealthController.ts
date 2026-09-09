import { CheckReadinessUseCase } from "../../../../../core/use-cases";
import { HttpResult, ok } from "../protocols";

const SERVICE_UNAVAILABLE = 503;

export interface ILivenessResponse {
  status: "ok";
  uptime: number;
}

export interface IReadinessResponse {
  status: "ok" | "degraded";
  dependencies: Record<string, string>;
}

export class HealthController {
  constructor(private readonly checkReadinessUseCase: CheckReadinessUseCase) {}

  public Live(): HttpResult<ILivenessResponse> {
    return ok({ status: "ok", uptime: process.uptime() });
  }

  public async Ready(): Promise<HttpResult<IReadinessResponse>> {
    const report = await this.checkReadinessUseCase.Execute();

    const dependencies = Object.fromEntries(
      report.dependencies.map((dependency) => [
        dependency.name,
        dependency.healthy ? "ok" : dependency.reason ?? "indisponível",
      ])
    );

    return {
      statusCode: report.healthy ? 200 : SERVICE_UNAVAILABLE,
      body: {
        status: report.healthy ? "ok" : "degraded",
        dependencies,
      },
    };
  }
}
