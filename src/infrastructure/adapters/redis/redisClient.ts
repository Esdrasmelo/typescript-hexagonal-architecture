import { Redis, RedisOptions } from "ioredis";

const MAX_RETRY_DELAY_MILLISECONDS = 2000;
const RETRY_STEP_MILLISECONDS = 100;
const COMMAND_RETRIES = 2;

const retryStrategy = (attempt: number): number =>
  Math.min(attempt * RETRY_STEP_MILLISECONDS, MAX_RETRY_DELAY_MILLISECONDS);

const baseOptions: RedisOptions = {
  retryStrategy,
  connectTimeout: 5000,
  keepAlive: 15_000,
};

export const createRedisClient = (url: string, connectionName: string): Redis =>
  new Redis(url, {
    ...baseOptions,
    connectionName,
    maxRetriesPerRequest: COMMAND_RETRIES,
    enableOfflineQueue: false,
  });

export const createQueueRedisClient = (
  url: string,
  connectionName: string
): Redis =>
  new Redis(url, {
    ...baseOptions,
    connectionName,
    maxRetriesPerRequest: null,
  });
