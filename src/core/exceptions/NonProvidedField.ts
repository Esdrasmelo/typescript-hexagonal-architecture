export class NonProvidedField extends Error {
  constructor(fieldName: string) {
    super();
    this.name = "NonProvidedField";
    this.message = `Please provide a value to the field ${fieldName}`;
  }
}
