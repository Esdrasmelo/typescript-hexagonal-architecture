import express, { Express, RequestHandler } from "express";
import rateLimit, { Store } from "express-rate-limit";
import helmet from "helmet";
import {
  IIdGeneratorPort,
  ILoggerPort,
  IRevokedTokenStorePort,
  ITokenServicePort,
} from "../../../../core/ports";
import { Env } from "../../../config/env";
import {
  ActivityController,
  AuthController,
  HealthController,
  MembershipController,
  OrganizationController,
  UserController,
} from "./controllers";
import {
  makeAuthMiddleware,
  makeErrorHandler,
  makeRequestContext,
  makeRequestLogger,
  notFoundHandler,
} from "./middlewares";
import {
  makeAuthRouter,
  makeHealthRouter,
  makeOrganizationRouter,
  makeUserRouter,
} from "./routes";

const MAX_REQUEST_BODY_SIZE = "16kb";
const MINUTE_IN_MILLISECONDS = 60 * 1000;

export interface IServerDependencies {
  env: Env;
  logger: ILoggerPort;
  idGenerator: IIdGeneratorPort;
  tokenService: ITokenServicePort;
  revokedTokenStore: IRevokedTokenStorePort;
  loginRateLimitStore?: Store;
  userController: UserController;
  authController: AuthController;
  organizationController: OrganizationController;
  membershipController: MembershipController;
  activityController: ActivityController;
  healthController: HealthController;
}

const makeLoginRateLimiter = (
  env: Env,
  store?: Store
): RequestHandler =>
  rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * MINUTE_IN_MILLISECONDS,
    limit: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store,
    message: {
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Tentativas de login em excesso. Tente novamente mais tarde.",
      },
    },
  });

export const createApp = (deps: IServerDependencies): Express => {
  const app = express();
  const authMiddleware = makeAuthMiddleware(
    deps.tokenService,
    deps.revokedTokenStore
  );

  app.disable("x-powered-by");
  app.use(makeRequestContext(deps.idGenerator));
  app.use(helmet());
  app.use(express.json({ limit: MAX_REQUEST_BODY_SIZE }));
  app.use(makeRequestLogger(deps.logger));

  app.use(makeHealthRouter(deps.healthController));
  app.use(
    makeUserRouter(
      deps.userController,
      deps.activityController,
      authMiddleware
    )
  );
  app.use(
    makeAuthRouter(
      deps.authController,
      makeLoginRateLimiter(deps.env, deps.loginRateLimitStore),
      authMiddleware
    )
  );
  app.use(
    makeOrganizationRouter(
      deps.organizationController,
      deps.membershipController,
      deps.activityController,
      authMiddleware
    )
  );

  app.use(notFoundHandler);
  app.use(makeErrorHandler(deps.logger));

  return app;
};
