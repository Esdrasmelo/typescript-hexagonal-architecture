import { IUserExpressRequest } from "../../src/infrastructure/adapters/api/express/interfaces";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: IUserExpressRequest;
    }
  }
}
