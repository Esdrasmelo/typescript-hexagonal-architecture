import { Redis } from "ioredis";
import { DependencyUnavailable } from "../../../core/exceptions";
import { IRevokedTokenStorePort } from "../../../core/ports";

const MINIMUM_TTL_IN_SECONDS = 1;

export class RedisRevokedTokenStore implements IRevokedTokenStorePort {
  constructor(
    private readonly client: Redis,
    private readonly namespace: string
  ) {}

  public async revoke(tokenId: string, expiresAt: Date): Promise<void> {
    const ttl = this.TtlFor(expiresAt);

    if (ttl < MINIMUM_TTL_IN_SECONDS) return;

    try {
      await this.client.set(this.KeyFor(tokenId), "1", "EX", ttl);
    } catch {
      throw new DependencyUnavailable("O serviço de sessões");
    }
  }

  public async isRevoked(tokenId: string): Promise<boolean> {
    try {
      return (await this.client.exists(this.KeyFor(tokenId))) === 1;
    } catch {
      throw new DependencyUnavailable("O serviço de sessões");
    }
  }

  private KeyFor(tokenId: string): string {
    return `${this.namespace}:revoked-token:${tokenId}`;
  }

  private TtlFor(expiresAt: Date): number {
    return Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
  }
}
