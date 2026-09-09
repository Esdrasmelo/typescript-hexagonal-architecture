import { Env, loadEnv } from "../../src/infrastructure/config/env";

export const testEnvSource: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "mysql://user:pass@localhost:3306/test",
  REDIS_URL: "redis://localhost:6379",
  MONGO_URL: "mongodb://localhost:27017",
  JWT_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
};

export const loadTestEnv = (overrides: NodeJS.ProcessEnv = {}): Env =>
  loadEnv({ ...testEnvSource, ...overrides });
