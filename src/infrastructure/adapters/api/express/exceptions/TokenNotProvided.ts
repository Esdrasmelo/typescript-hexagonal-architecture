export class TokenNotProvided extends Error {
  constructor() {
    super();
    this.name = "TokenNotProvided";
    this.message = "JWT Token not provided. Please, provide a JWT Token!";
  }
}
