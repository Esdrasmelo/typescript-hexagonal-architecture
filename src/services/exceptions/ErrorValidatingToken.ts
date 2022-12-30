export class ErrorValidatingToken extends Error {
  constructor() {
    super();
    this.name = "ErrorValidatingToken";
    this.message =
      "It was not possible validate the provided JWT Token, something went wrong!";
  }
}
