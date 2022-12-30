import { Router } from "express";
import { authControllerMount } from "../../../controllers/mount";

export const authRouter = Router();

const authController = authControllerMount();

authRouter.post("/auth/login", async (request, response) => {
  const loginData = request.body;

  const { statusCode, body } = await authController.Login(loginData);

  return response.status(statusCode).json(body);
});
