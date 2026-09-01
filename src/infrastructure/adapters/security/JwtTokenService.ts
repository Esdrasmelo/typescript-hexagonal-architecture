import jwt, { SignOptions } from "jsonwebtoken";
import { InvalidToken } from "../../../core/exceptions";
import { ITokenPayload, ITokenServicePort } from "../../../core/ports";

const ALGORITHM = "HS256";

export class JwtTokenService implements ITokenServicePort {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  public sign(payload: ITokenPayload): string {
    return jwt.sign({ email: payload.email }, this.secret, {
      subject: payload.sub,
      expiresIn: this.expiresIn,
      algorithm: ALGORITHM,
    } as SignOptions);
  }

  public verify(token: string): ITokenPayload {
    try {
      return this.DecodeSignedPayload(token);
    } catch {
      throw new InvalidToken();
    }
  }

  private DecodeSignedPayload(token: string): ITokenPayload {
    const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string"
    ) {
      throw new InvalidToken();
    }

    return { sub: decoded.sub, email: decoded.email };
  }
}
