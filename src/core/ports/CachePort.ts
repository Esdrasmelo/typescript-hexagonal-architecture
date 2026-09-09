export interface ICachePort {
  get<TValue>(key: string): Promise<TValue | null>;
  set<TValue>(key: string, value: TValue, ttlInSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}
