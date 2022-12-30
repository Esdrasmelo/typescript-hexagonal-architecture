export class InvalidPassword extends Error {
  constructor() {
    super();
    this.name = "InvalidPassword";
    this.message = "The provided password is invalid";
  }
}
