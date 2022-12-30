import express, { Express, Request, Response, Router } from "express";
import { userRouter, authRouter } from "./routes";
import { AuthService } from "../../../../services/auth/Auth";
import { IUserExpressRequest } from "./interfaces";
import { unauthorizedRequestResponse } from "../../../../core";
import {
  BadJwtTokenFormat,
  TokenNotProvided,
} from "../../../../services/exceptions";

export class ExpressServer {
  private appPort: number;
  private app: Express = express();

  constructor(port: number) {
    this.appPort = port;
  }

  private StoreUserInExpressRequest(
    userData: IUserExpressRequest,
    request: Request
  ) {
    request.user = userData;
  }

  private ValidateRequestsMiddleware(request: Request, response: Response) {
    let token = request.headers["authorization"];

    if (!token) {
      const { statusCode, body } = unauthorizedRequestResponse(
        new TokenNotProvided()
      );
      return response.status(statusCode).json(body);
    }

    const getBearerString = token.includes("Bearer");

    if (!getBearerString) {
      const { statusCode, body } = unauthorizedRequestResponse(
        new BadJwtTokenFormat()
      );
      return response.status(statusCode).json(body);
    }

    const validateToken = AuthService.ValidateJwtToken(token);

    if (typeof validateToken !== "string") {
      if (validateToken.statusCode)
        return response
          .status(validateToken.statusCode)
          .json(validateToken.body);

      const { email, id }: IUserExpressRequest = validateToken as any;

      this.StoreUserInExpressRequest({ email, id }, request);
    }
  }

  async server() {
    this.app.use(express.json());

    this.app.use((request, response, next) => {
      if (!request.url.includes("login"))
        this.ValidateRequestsMiddleware(request, response);

      next();
    });

    this.app.use("/", [userRouter, authRouter]);

    this.app.listen(this.appPort, () => {
      console.log(`Server is running at http://localhost:${this.appPort}`);
    });
  }
}
