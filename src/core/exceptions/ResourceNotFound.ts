export class ResourceNotFound extends Error {
  constructor(resource: string) {
    super();
    this.name = "NotFoundData";
    this.message = `${resource} not found!`;
  }
}
