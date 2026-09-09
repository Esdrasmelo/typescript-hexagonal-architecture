import { NextFunction, Request, RequestHandler, Response } from "express";
import { IIdGeneratorPort, ILoggerPort } from "../../../../../core/ports";

const REQUEST_ID_HEADER = "x-request-id";
const MAX_REQUEST_ID_LENGTH = 64;
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]+$/;
const NANOSECONDS_PER_MILLISECOND = 1_000_000;
const SILENT_PATHS = ["/health"];

const readProvidedId = (request: Request): string | null => {
  const header = request.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(header) ? header[0] : header;

  if (
    !candidate ||
    candidate.length > MAX_REQUEST_ID_LENGTH ||
    !SAFE_REQUEST_ID.test(candidate)
  ) {
    return null;
  }

  return candidate;
};

export const makeRequestContext =
  (idGenerator: IIdGeneratorPort): RequestHandler =>
  (request: Request, response: Response, next: NextFunction): void => {
    const requestId = readProvidedId(request) ?? idGenerator.generate();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  };

export const makeRequestLogger =
  (logger: ILoggerPort): RequestHandler =>
  (request: Request, response: Response, next: NextFunction): void => {
    if (SILENT_PATHS.some((path) => request.path.startsWith(path))) {
      return next();
    }

    const startedAt = process.hrtime.bigint();

    response.on("finish", () => {
      const elapsed = Number(process.hrtime.bigint() - startedAt);

      logger.info("Requisição concluída", {
        method: request.method,
        path: request.path,
        status: response.statusCode,
        durationMs: Math.round(elapsed / NANOSECONDS_PER_MILLISECOND),
        requestId: request.requestId ?? null,
        actorId: request.user?.id ?? null,
      });
    });

    next();
  };
