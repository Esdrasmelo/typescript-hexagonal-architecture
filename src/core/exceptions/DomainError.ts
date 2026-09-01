export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED";

export abstract class DomainError extends Error {
  public abstract readonly code: DomainErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export const isDomainError = (error: unknown): error is DomainError =>
  error instanceof DomainError;
