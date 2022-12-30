export class InternalServerError extends Error {
  constructor() {
    super();
    this.name = "InternalServerError";
    this.message = "Internal Server Error: something went wrong internally!";
  }
}
