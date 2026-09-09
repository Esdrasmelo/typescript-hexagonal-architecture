export interface IRevokedTokenStorePort {
  revoke(tokenId: string, expiresAt: Date): Promise<void>;
  isRevoked(tokenId: string): Promise<boolean>;
}
