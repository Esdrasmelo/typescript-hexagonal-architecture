import { RequestHandler, Router } from "express";
import { AuthController } from "../controllers";
import { asyncHandler } from "../middlewares";

export const makeAuthRouter = (
  controller: AuthController,
  rateLimiter: RequestHandler
): Router => {
  const router = Router();

  router.post(
    "/auth/login",
    rateLimiter,
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await controller.Login(request.body);

      response.status(statusCode).json(body);
    })
  );

  return router;
};
