export interface ITokenPayload {
  sub: string;
  email: string;
}

export interface ITokenServicePort {
  sign(payload: ITokenPayload): string;
  verify(token: string): ITokenPayload;
}
