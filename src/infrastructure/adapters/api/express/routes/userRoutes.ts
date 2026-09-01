import { RequestHandler, Router } from "express";
import { UserController } from "../controllers";
import { asyncHandler } from "../middlewares";

export const makeUserRouter = (
  controller: UserController,
  authMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.post(
    "/users",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await controller.CreateUser(request.body);

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

  return router;
};
