export interface ITokenPayload {
  sub: string;
  email: string;
}

export interface IIssuedToken {
  id: string;
  token: string;
  expiresAt: Date;
}

export interface IVerifiedToken extends ITokenPayload {
  id: string;
  expiresAt: Date;
}

export interface ITokenServicePort {
  sign(payload: ITokenPayload): IIssuedToken;
  verify(token: string): IVerifiedToken;
}
