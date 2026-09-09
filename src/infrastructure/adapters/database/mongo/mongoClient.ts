import { Db, MongoClient } from "mongodb";

const SECONDS_PER_DAY = 86_400;
const SERVER_SELECTION_TIMEOUT_MS = 5000;
const MAX_POOL_SIZE = 10;

export const COLLECTIONS = {
  notifications: "notifications",
  auditEvents: "audit_events",
} as const;

export interface IMongoConnection {
  client: MongoClient;
  database: Db;
}

export const connectToMongo = async (
  url: string,
  databaseName: string
): Promise<IMongoConnection> => {
  const client = new MongoClient(url, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    maxPoolSize: MAX_POOL_SIZE,
    retryWrites: true,
  });

  await client.connect();

  return { client, database: client.db(databaseName) };
};

export const ensureIndexes = async (
  database: Db,
  auditRetentionInDays: number
): Promise<void> => {
  await database.collection(COLLECTIONS.notifications).createIndexes([
    {
      key: { recipientId: 1, createdAt: -1 },
      name: "notifications_by_recipient",
    },
    { key: { status: 1, createdAt: 1 }, name: "notifications_by_status" },
  ]);

  await database.collection(COLLECTIONS.auditEvents).createIndexes([
    {
      key: { organizationId: 1, occurredAt: -1 },
      name: "audit_by_organization",
    },
    { key: { actorId: 1, occurredAt: -1 }, name: "audit_by_actor" },
    {
      key: { occurredAt: 1 },
      name: "audit_retention",
      expireAfterSeconds: auditRetentionInDays * SECONDS_PER_DAY,
    },
  ]);
};
