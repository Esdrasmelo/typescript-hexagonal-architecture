import express, { Express, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ITokenServicePort } from "../../../../core/ports";
import { Env } from "../../../config/env";
import { AuthController, UserController } from "./controllers";
import {
  errorHandler,
  makeAuthMiddleware,
  notFoundHandler,
} from "./middlewares";
import { makeAuthRouter, makeHealthRouter, makeUserRouter } from "./routes";

const MAX_REQUEST_BODY_SIZE = "16kb";
const MINUTE_IN_MILLISECONDS = 60 * 1000;

export interface IServerDependencies {
  env: Env;
  tokenService: ITokenServicePort;
  userController: UserController;
  authController: AuthController;
}

const makeLoginRateLimiter = (env: Env): RequestHandler =>
  rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * MINUTE_IN_MILLISECONDS,
    limit: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Tentativas de login em excesso. Tente novamente mais tarde.",
      },
    },
  });

export const createApp = (deps: IServerDependencies): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: MAX_REQUEST_BODY_SIZE }));

  app.use(makeHealthRouter());
  app.use(
    makeUserRouter(deps.userController, makeAuthMiddleware(deps.tokenService))
  );
  app.use(makeAuthRouter(deps.authController, makeLoginRateLimiter(deps.env)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
