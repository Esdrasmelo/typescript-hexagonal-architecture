export class PasswordLenghtIsTooSmall extends Error {
  constructor() {
    super();
    this.name = "PasswordLenghtIsTooSmall";
    this.message = "Please provide a password lenght bigger than 8 characters";
  }
}
