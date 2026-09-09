import { RequestHandler, Router } from "express";
import { AuthController } from "../controllers";
import { asyncHandler } from "../middlewares";
import { readSession } from "../protocols";

export const makeAuthRouter = (
  controller: AuthController,
  rateLimiter: RequestHandler,
  authMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.post(
    "/auth/login",
    rateLimiter,
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await controller.Login(request.body, {
        requestId: request.requestId ?? null,
      });

      response.status(statusCode).json(body);
    })
  );

  router.post(
    "/auth/logout",
    authMiddleware,
    asyncHandler(async (request, response) => {
      const { statusCode } = await controller.Logout(readSession(request));

      response.status(statusCode).end();
    })
  );

  return router;
};
