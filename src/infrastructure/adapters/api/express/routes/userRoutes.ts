import { RequestHandler, Router } from "express";
import { ActivityController, UserController } from "../controllers";
import { asyncHandler } from "../middlewares";
import { readActor } from "../protocols";

export const makeUserRouter = (
  controller: UserController,
  activity: ActivityController,
  authMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.post(
    "/users",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await controller.CreateUser(request.body, {
        requestId: request.requestId ?? null,
      });

      response.status(statusCode).json(body);
    })
  );

  router.get(
    "/users",
    authMiddleware,
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await controller.GetUsers(request.query);

      response.status(statusCode).json(body);
    })
  );

  router.get(
    "/me/notifications",
    authMiddleware,
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await activity.ListMyNotifications(
        request.query,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  return router;
};
