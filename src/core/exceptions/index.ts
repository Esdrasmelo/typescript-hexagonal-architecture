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

export class FieldIsTooLong extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor(field: string, maxLength: number) {
    super(`O campo "${field}" deve ter no máximo ${maxLength} caracteres.`);
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

export class SlugIsNotValid extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor() {
    super(
      "O identificador deve ter de 3 a 48 caracteres, apenas letras minúsculas, números e hifens."
    );
  }
}

export class MembershipRoleIsNotValid extends DomainError {
  public readonly code: DomainErrorCode = "VALIDATION_ERROR";

  constructor(accepted: readonly string[]) {
    super(`O papel informado não existe. Aceitos: ${accepted.join(", ")}.`);
  }
}

export class ForbiddenAction extends DomainError {
  public readonly code: DomainErrorCode = "FORBIDDEN";

  constructor(action: string) {
    super(`Você não tem permissão para ${action}.`);
  }
}

export class OrganizationNeedsAnOwner extends DomainError {
  public readonly code: DomainErrorCode = "CONFLICT";

  constructor() {
    super("A organização precisa de pelo menos um proprietário.");
  }
}

export class DependencyUnavailable extends DomainError {
  public readonly code: DomainErrorCode = "SERVICE_UNAVAILABLE";

  constructor(dependency: string) {
    super(`${dependency} está indisponível. Tente novamente em instantes.`);
  }
}
