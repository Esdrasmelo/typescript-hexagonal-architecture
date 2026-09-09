import { Router } from "express";
import { HealthController } from "../controllers";
import { asyncHandler } from "../middlewares";

export const makeHealthRouter = (controller: HealthController): Router => {
  const router = Router();

  router.get("/health", (_request, response) => {
    const { statusCode, body } = controller.Live();

    response.status(statusCode).json(body);
  });

  router.get(
    "/health/ready",
    asyncHandler(async (_request, response) => {
      const { statusCode, body } = await controller.Ready();

      response.status(statusCode).json(body);
    })
  );

  return router;
};
