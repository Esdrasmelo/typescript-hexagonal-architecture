import { Request } from "express";
import { TokenNotProvided } from "../../../../../core/exceptions";

export interface IActorContext {
  actorId: string;
  requestId: string | null;
}

export interface ISessionContext extends IActorContext {
  tokenId: string;
  expiresAt: Date;
}

export const readSession = (request: Request): ISessionContext => {
  if (!request.user) throw new TokenNotProvided();

  return {
    actorId: request.user.id,
    tokenId: request.user.tokenId,
    expiresAt: request.user.tokenExpiresAt,
    requestId: request.requestId ?? null,
  };
};

export const readActor = (request: Request): IActorContext => {
  const { actorId, requestId } = readSession(request);

  return { actorId, requestId };
};
