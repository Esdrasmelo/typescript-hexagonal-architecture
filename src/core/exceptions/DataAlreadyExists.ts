export class DataAlreadyExists extends Error {
  constructor(resource: string) {
    super();
    this.name = "DataAlreadyExists";
    this.message = `${resource} already exists`;
  }
}
