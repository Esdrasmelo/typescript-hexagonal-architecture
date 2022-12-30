import { Router } from "express";
import { userControllerMount } from "../../../controllers/mount/";

export const userRouter = Router();

const userController = userControllerMount();

userRouter.post("/users/create", async (request, response) => {
  const userData = request.body;
  const { statusCode, body } = await userController.CreateUser(userData);

  return response.status(statusCode).json(body);
});

userRouter.get("/users", async (request, response) => {
  const { email } = request.query;

  const { statusCode, body } = email
    ? await userController.GetUserByEmail(email as string)
    : await userController.GetUsers();

  return response.status(statusCode).json(body);
});
