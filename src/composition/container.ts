import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindUserByEmailUseCase,
  LoginUseCase,
} from "../core/use-cases";
import {
  AuthController,
  UserController,
} from "../infrastructure/adapters/api/express/controllers";
import { UserPrismaRepository } from "../infrastructure/adapters/database/prisma";
import {
  JwtTokenService,
  ScryptPasswordHasher,
} from "../infrastructure/adapters/security";
import {
  CryptoIdGenerator,
  SystemClock,
} from "../infrastructure/adapters/system";
import { Env } from "../infrastructure/config/env";

export const buildContainer = (env: Env) => {
  const userRepository = new UserPrismaRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const idGenerator = new CryptoIdGenerator();
  const clock = new SystemClock();

  const userController = new UserController({
    createUserUseCase: new CreateUserUseCase(
      userRepository,
      passwordHasher,
      idGenerator,
      clock
    ),
    findAllUsersUseCase: new FindAllUsersUseCase(userRepository),
    findUserByEmailUseCase: new FindUserByEmailUseCase(userRepository),
  });

  const authController = new AuthController(
    new LoginUseCase(userRepository, passwordHasher, tokenService)
  );

  return { tokenService, userController, authController };
};
