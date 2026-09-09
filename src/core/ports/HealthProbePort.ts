export interface IHealthProbePort {
  readonly name: string;
  check(): Promise<void>;
}
