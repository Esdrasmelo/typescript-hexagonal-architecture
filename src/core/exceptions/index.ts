import { DomainError, DomainErrorCode } from "./DomainError";

export * from "./DomainError";

export class NonProvidedField extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor(field: string) {
    super(`O campo "${field}" é obrigatório.`);
  }
}

export class EmailIsNotValid extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor() {
    super("O e-mail informado não é válido.");
  }
}

export class PasswordIsTooShort extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor(minLength: number) {
    super(`A senha deve ter no mínimo ${minLength} caracteres.`);
  }
}

export class PasswordIsTooLong extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor(maxLength: number) {
    super(`A senha deve ter no máximo ${maxLength} caracteres.`);
  }
}

export class ResourceNotFound extends DomainError {
  public readonly code: DomainErrorCode = "NOT_FOUND";

  constructor(resource: string) {
    super(`${resource} não encontrado.`);
  }
}

export class DataAlreadyExists extends DomainError {
  public readonly code: DomainErrorCode = "CONFLICT";

  constructor(resource: string) {
    super(`${resource} já existe.`);
  }
}

export class InvalidCredentials extends DomainError {
  public readonly code: DomainErrorCode = "UNAUTHORIZED";

  constructor() {
    super("E-mail ou senha inválidos.");
  }
}

export class TokenNotProvided extends DomainError {
  public readonly code: DomainErrorCode = "UNAUTHORIZED";

  constructor() {
    super("Token de autenticação não informado.");
  }
}

export class InvalidToken extends DomainError {
  public readonly code: DomainErrorCode = "UNAUTHORIZED";

  constructor() {
    super("Token de autenticação inválido ou expirado.");
  }
}
