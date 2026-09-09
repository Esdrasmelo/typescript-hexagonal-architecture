import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import {
  buildInfrastructure,
  createLogger,
  IInfrastructure,
} from "./composition/infrastructure";
import { buildWorkerDependencies } from "./composition/workerContainer";
import {
  closeWorkers,
  createWorkers,
  QUEUE_NAMES,
} from "./infrastructure/adapters/queue";
import { createQueueRedisClient } from "./infrastructure/adapters/redis";
import { loadEnv } from "./infrastructure/config/env";

const SHUTDOWN_TIMEOUT_MS = 30_000;

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
  workers: Worker[],
  connection: Redis,
  infrastructure: IInfrastructure
): void => {
  const { logger } = infrastructure;
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("Encerrando os workers", { signal });

    const timer = forceExitAfterTimeout(infrastructure);

    await closeWorkers(workers);
    connection.disconnect();
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
  const logger = createLogger(env, "worker");
  const infrastructure = await buildInfrastructure(env, logger);
  const connection = createQueueRedisClient(env.REDIS_URL, "workers");

  const workers = createWorkers(
    connection,
    env,
    buildWorkerDependencies(infrastructure),
    logger
  );

  logger.info("Workers ouvindo as filas", {
    queues: Object.values(QUEUE_NAMES).join(", "),
    concurrency: env.QUEUE_CONCURRENCY,
  });

  registerShutdownHooks(workers, connection, infrastructure);
};

bootstrap().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Falha ao iniciar os workers."
  );
  process.exit(1);
});
