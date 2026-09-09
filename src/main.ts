import "dotenv/config";
import { Server } from "node:http";
import { buildContainer } from "./composition/container";
import {
  buildInfrastructure,
  createLogger,
  IInfrastructure,
} from "./composition/infrastructure";
import { createApp } from "./infrastructure/adapters/api/express/server";
import { loadEnv } from "./infrastructure/config/env";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve) => server.close(() => resolve()));

const forceExitAfterTimeout = (
  infrastructure: IInfrastructure
): NodeJS.Timeout => {
  const timer = setTimeout(() => {
    infrastructure.logger.error("Encerramento demorou demais, forçando saída");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  timer.unref();

  return timer;
};

const registerShutdownHooks = (
  server: Server,
  infrastructure: IInfrastructure
): void => {
  const { logger } = infrastructure;
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("Encerrando a API", { signal });

    const timer = forceExitAfterTimeout(infrastructure);

    await closeServer(server);
    await infrastructure.shutdown();

    clearTimeout(timer);
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Promise rejeitada sem tratamento", {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("Exceção não capturada", { reason: error.message });
    void shutdown("uncaughtException");
  });
};

const bootstrap = async (): Promise<void> => {
  const env = loadEnv();
  const logger = createLogger(env, "api");
  const infrastructure = await buildInfrastructure(env, logger);
  const container = buildContainer(env, infrastructure);

  const app = createApp({
    env,
    logger,
    revokedTokenStore: infrastructure.revokedTokenStore,
    loginRateLimitStore: infrastructure.loginRateLimitStore,
    ...container,
  });

  const server = app.listen(env.APP_PORT, () => {
    logger.info("API ouvindo", { port: env.APP_PORT, env: env.NODE_ENV });
  });

  registerShutdownHooks(server, infrastructure);
};

bootstrap().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Falha ao iniciar a aplicação."
  );
  process.exit(1);
});
