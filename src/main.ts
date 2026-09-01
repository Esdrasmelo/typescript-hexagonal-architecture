import "dotenv/config";
import { Server } from "node:http";
import { buildContainer } from "./composition/container";
import { createApp } from "./infrastructure/adapters/api/express/server";
import { prismaClient } from "./infrastructure/adapters/database/prisma";
import { loadEnv } from "./infrastructure/config/env";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve) => server.close(() => resolve()));

const forceExitAfterTimeout = (): NodeJS.Timeout => {
  const timer = setTimeout(() => {
    console.error("Encerramento demorou demais, forçando saída.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  timer.unref();

  return timer;
};

const registerShutdownHooks = (server: Server): void => {
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} recebido, encerrando...`);

    const timer = forceExitAfterTimeout();

    await closeServer(server);
    await prismaClient.$disconnect();

    clearTimeout(timer);
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("[uncaughtException]", error);
    void shutdown("uncaughtException");
  });
};

const bootstrap = (): void => {
  const env = loadEnv();
  const container = buildContainer(env);
  const app = createApp({ env, ...container });

  const server = app.listen(env.APP_PORT, () => {
    console.log(`Servidor ouvindo em http://localhost:${env.APP_PORT}`);
  });

  registerShutdownHooks(server);
};

try {
  bootstrap();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Falha ao iniciar a aplicação."
  );
  process.exit(1);
}
