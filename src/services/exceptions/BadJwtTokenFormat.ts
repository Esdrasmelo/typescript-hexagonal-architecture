export class BadJwtTokenFormat extends Error {
  constructor() {
    super();
    this.name = "BadJwtTokenFormat";
    this.message = "The provided token is provided using invalid format!";
  }
}
