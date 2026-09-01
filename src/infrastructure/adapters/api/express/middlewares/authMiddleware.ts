import { NextFunction, Request, Response } from "express";
import { InvalidToken, TokenNotProvided } from "../../../../../core/exceptions";
import { ITokenServicePort } from "../../../../../core/ports";

const BEARER_SCHEME = "Bearer";

const readBearerToken = (header?: string): string => {
  if (!header) throw new TokenNotProvided();

  const [scheme, token] = header.split(" ");

  if (scheme !== BEARER_SCHEME || !token) throw new InvalidToken();

  return token;
};

export const makeAuthMiddleware =
  (tokenService: ITokenServicePort) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    try {
      const payload = tokenService.verify(
        readBearerToken(request.headers.authorization)
      );

      request.user = { id: payload.sub, email: payload.email };

      next();
    } catch (error) {
      next(error);
    }
  };
