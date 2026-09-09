import { IHealthProbePort } from "../../ports";
import { IUseCaseWithoutInput } from "../UseCase";

export interface IDependencyStatus {
  name: string;
  healthy: boolean;
  reason?: string;
}

export interface IReadinessReport {
  healthy: boolean;
  dependencies: IDependencyStatus[];
}

const TIMED_OUT = "tempo de resposta excedido";

export class CheckReadinessUseCase
  implements IUseCaseWithoutInput<IReadinessReport>
{
  constructor(
    private readonly probes: readonly IHealthProbePort[],
    private readonly timeoutInMilliseconds: number
  ) {}

  public async Execute(): Promise<IReadinessReport> {
    const dependencies = await Promise.all(
      this.probes.map((probe) => this.Inspect(probe))
    );

    return {
      healthy: dependencies.every((dependency) => dependency.healthy),
      dependencies,
    };
  }

  private async Inspect(probe: IHealthProbePort): Promise<IDependencyStatus> {
    try {
      await this.WithTimeout(probe.check());

      return { name: probe.name, healthy: true };
    } catch (error) {
      return {
        name: probe.name,
        healthy: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private WithTimeout(check: Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(TIMED_OUT)),
        this.timeoutInMilliseconds
      );

      check
        .then(resolve, reject)
        .finally(() => clearTimeout(timer));
    });
  }
}
