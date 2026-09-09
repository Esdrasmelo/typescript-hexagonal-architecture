import jwt, { SignOptions } from "jsonwebtoken";
import { InvalidToken } from "../../../core/exceptions";
import {
  IIdGeneratorPort,
  IIssuedToken,
  ITokenPayload,
  ITokenServicePort,
  IVerifiedToken,
} from "../../../core/ports";

const ALGORITHM = "HS256";
const SECONDS_TO_MILLISECONDS = 1000;

export class JwtTokenService implements ITokenServicePort {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
    private readonly idGenerator: IIdGeneratorPort
  ) {}

  public sign(payload: ITokenPayload): IIssuedToken {
    const id = this.idGenerator.generate();
    const token = jwt.sign({ email: payload.email }, this.secret, {
      subject: payload.sub,
      jwtid: id,
      expiresIn: this.expiresIn,
      algorithm: ALGORITHM,
    } as SignOptions);

    return { id, token, expiresAt: JwtTokenService.ReadExpiration(token) };
  }

  public verify(token: string): IVerifiedToken {
    try {
      return this.DecodeSignedPayload(token);
    } catch {
      throw new InvalidToken();
    }
  }

  private static ReadExpiration(token: string): Date {
    const decoded = jwt.decode(token);

    if (
      !decoded ||
      typeof decoded === "string" ||
      typeof decoded.exp !== "number"
    ) {
      throw new Error("JWT_EXPIRES_IN não produziu um token com expiração.");
    }

    return new Date(decoded.exp * SECONDS_TO_MILLISECONDS);
  }

  private DecodeSignedPayload(token: string): IVerifiedToken {
    const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.jti !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      throw new InvalidToken();
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      id: decoded.jti,
      expiresAt: new Date(decoded.exp * SECONDS_TO_MILLISECONDS),
    };
  }
}
