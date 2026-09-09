import { PrismaClient } from "@prisma/client";
import { Store } from "express-rate-limit";
import { Redis } from "ioredis";
import {
  IAuditEventRepositoryPort,
  ICachePort,
  IHealthProbePort,
  ILoggerPort,
  IMembershipRepositoryPort,
  INotificationRepositoryPort,
  IOrganizationRepositoryPort,
  IRevokedTokenStorePort,
  IUserRepositoryPort,
} from "../core/ports";
import { RedisRateLimitStore } from "../infrastructure/adapters/api/express/middlewares";
import { RedisCache, ResilientCache } from "../infrastructure/adapters/cache";
import {
  AuditEventMongoRepository,
  connectToMongo,
  ensureIndexes,
  IMongoConnection,
  NotificationMongoRepository,
} from "../infrastructure/adapters/database/mongo";
import {
  MembershipPrismaRepository,
  OrganizationPrismaRepository,
  prismaClient,
  UserPrismaRepository,
} from "../infrastructure/adapters/database/prisma";
import {
  MongoHealthProbe,
  PrismaHealthProbe,
  QueueHealthProbe,
  RedisHealthProbe,
} from "../infrastructure/adapters/health";
import { JsonLogger } from "../infrastructure/adapters/observability";
import {
  closeQueues,
  createQueues,
  IQueues,
} from "../infrastructure/adapters/queue";
import {
  createQueueRedisClient,
  createRedisClient,
} from "../infrastructure/adapters/redis";
import { RedisRevokedTokenStore } from "../infrastructure/adapters/security";
import { Env } from "../infrastructure/config/env";

export interface IRepositories {
  users: IUserRepositoryPort;
  organizations: IOrganizationRepositoryPort;
  memberships: IMembershipRepositoryPort;
  notifications: INotificationRepositoryPort;
  auditEvents: IAuditEventRepositoryPort;
}

export interface IInfrastructure {
  logger: ILoggerPort;
  prisma: PrismaClient;
  mongo: IMongoConnection;
  redis: Redis;
  queueRedis: Redis;
  queues: IQueues;
  cache: ICachePort;
  revokedTokenStore: IRevokedTokenStorePort;
  loginRateLimitStore: Store;
  probes: IHealthProbePort[];
  repositories: IRepositories;
  shutdown(): Promise<void>;
}

export const createLogger = (env: Env, service: string): ILoggerPort =>
  new JsonLogger({ level: env.LOG_LEVEL, service });

const disconnectRedis = async (client: Redis): Promise<void> => {
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
};

export const buildInfrastructure = async (
  env: Env,
  logger: ILoggerPort
): Promise<IInfrastructure> => {
  const redis = createRedisClient(env.REDIS_URL, "app");
  const queueRedis = createQueueRedisClient(env.REDIS_URL, "queues");

  redis.on("error", (error: Error) => {
    logger.warn("Conexão com o Redis reportou erro", {
      reason: error.message,
    });
  });

  const mongo = await connectToMongo(env.MONGO_URL, env.MONGO_DATABASE);

  await ensureIndexes(mongo.database, env.AUDIT_RETENTION_DAYS);

  const queues = createQueues(queueRedis, env);

  const infrastructure: IInfrastructure = {
    logger,
    prisma: prismaClient,
    mongo,
    redis,
    queueRedis,
    queues,
    cache: new ResilientCache(
      new RedisCache(redis, env.CACHE_NAMESPACE),
      logger
    ),
    revokedTokenStore: new RedisRevokedTokenStore(redis, env.CACHE_NAMESPACE),
    loginRateLimitStore: new RedisRateLimitStore(
      redis,
      env.CACHE_NAMESPACE,
      logger
    ),
    probes: [
      new PrismaHealthProbe(prismaClient),
      new RedisHealthProbe(redis),
      new MongoHealthProbe(mongo.database),
      new QueueHealthProbe([queues.domainEvents, queues.notifications]),
    ],
    repositories: {
      users: new UserPrismaRepository(),
      organizations: new OrganizationPrismaRepository(),
      memberships: new MembershipPrismaRepository(),
      notifications: new NotificationMongoRepository(mongo.database),
      auditEvents: new AuditEventMongoRepository(mongo.database),
    },
    shutdown: async (): Promise<void> => {
      await closeQueues(queues);
      await Promise.all([
        disconnectRedis(redis),
        disconnectRedis(queueRedis),
        mongo.client.close(),
        prismaClient.$disconnect(),
      ]);
    },
  };

  return infrastructure;
};
