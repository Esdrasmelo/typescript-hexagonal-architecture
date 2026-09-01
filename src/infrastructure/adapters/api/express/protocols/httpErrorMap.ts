import { DomainErrorCode } from "../../../../../core/exceptions";

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

const INTERNAL_ERROR_STATUS = 500;

export const toHttpStatus = (code: DomainErrorCode): number =>
  STATUS_BY_CODE[code] ?? INTERNAL_ERROR_STATUS;
