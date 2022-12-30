import { FindUserByEmailUseCase } from "../../../../core";
import { AuthService } from "../../../../services/auth/Auth";
import { UserPrismaRepository } from "../../database/prisma/repository";
import { AuthController } from "../AuthController";

export const authControllerMount = (): AuthController => {
  const userPrismaRepository = new UserPrismaRepository();
  const findUserByEmailUseCase = new FindUserByEmailUseCase(
    userPrismaRepository
  );
  const authService = new AuthService(findUserByEmailUseCase);
  const authController = new AuthController(authService);

  return authController;
};
