import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainError, isDomainError } from "../../../../../core/exceptions";
import { ILoggerPort } from "../../../../../core/ports";
import { toHttpStatus } from "../protocols";

export interface IErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const respondWithDomainError = (
  response: Response,
  error: DomainError
): void => {
  const payload: IErrorResponse = {
    error: { code: error.code, message: error.message },
  };

  response.status(toHttpStatus(error.code)).json(payload);
};

const respondWithValidationError = (
  response: Response,
  error: ZodError
): void => {
  const payload: IErrorResponse = {
    error: {
      code: "VALIDATION_ERROR",
      message: "Requisição inválida.",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    },
  };

  response.status(400).json(payload);
};

const respondWithInternalError = (response: Response): void => {
  const payload: IErrorResponse = {
    error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." },
  };

  response.status(500).json(payload);
};

export const makeErrorHandler =
  (logger: ILoggerPort): ErrorRequestHandler =>
  (
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction
  ): void => {
    if (response.headersSent) return next(error);

    if (isDomainError(error)) return respondWithDomainError(response, error);

    if (error instanceof ZodError) {
      return respondWithValidationError(response, error);
    }

    logger.error("Erro não tratado", {
      method: request.method,
      path: request.path,
      requestId: request.requestId ?? null,
      reason: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });

    return respondWithInternalError(response);
  };

export const notFoundHandler = (request: Request, response: Response): void => {
  const payload: IErrorResponse = {
    error: {
      code: "NOT_FOUND",
      message: `Rota ${request.method} ${request.path} não existe.`,
    },
  };

  response.status(404).json(payload);
};
