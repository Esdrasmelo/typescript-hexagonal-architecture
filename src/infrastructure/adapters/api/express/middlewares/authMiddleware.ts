import { NextFunction, Request, RequestHandler, Response } from "express";
import { InvalidToken, TokenNotProvided } from "../../../../../core/exceptions";
import {
  IRevokedTokenStorePort,
  ITokenServicePort,
} from "../../../../../core/ports";

const BEARER_SCHEME = "Bearer";

const readBearerToken = (header?: string): string => {
  if (!header) throw new TokenNotProvided();

  const [scheme, token] = header.split(" ");

  if (scheme !== BEARER_SCHEME || !token) throw new InvalidToken();

  return token;
};

export const makeAuthMiddleware = (
  tokenService: ITokenServicePort,
  revokedTokenStore: IRevokedTokenStorePort
): RequestHandler => {
  const authenticate = async (request: Request): Promise<void> => {
    const payload = tokenService.verify(
      readBearerToken(request.headers.authorization)
    );

    if (await revokedTokenStore.isRevoked(payload.id)) {
      throw new InvalidToken();
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      tokenId: payload.id,
      tokenExpiresAt: payload.expiresAt,
    };
  };

  return (
    request: Request,
    _response: Response,
    next: NextFunction
  ): void => {
    authenticate(request).then(() => next(), next);
  };
};
