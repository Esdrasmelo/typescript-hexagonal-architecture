declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tokenId: string;
        tokenExpiresAt: Date;
      };
      requestId?: string;
    }
  }
}

export {};
