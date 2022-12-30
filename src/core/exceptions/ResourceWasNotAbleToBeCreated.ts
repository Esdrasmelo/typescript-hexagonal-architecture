export class ResourceWasNotAbleToBeCreated extends Error {
  constructor(resource: string) {
    super();
    this.name = "ResourceWasNotAbleToBeCreated";
    this.message = `Somenthing Went Wrong. ${resource} was not able to be created!`;
  }
}
