import { Prisma, PrismaClient } from "@prisma/client";

const logLevelsFor = (environment?: string): Prisma.LogLevel[] =>
  environment === "development" ? ["warn", "error"] : ["error"];

export const prismaClient = new PrismaClient({
  log: logLevelsFor(process.env.NODE_ENV),
});
