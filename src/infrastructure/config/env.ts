import { z, ZodIssue } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  REDIS_URL: z
    .string()
    .regex(/^rediss?:\/\//, "REDIS_URL deve começar com redis:// ou rediss://"),
  MONGO_URL: z
    .string()
    .regex(
      /^mongodb(\+srv)?:\/\//,
      "MONGO_URL deve começar com mongodb:// ou mongodb+srv://"
    ),
  MONGO_DATABASE: z.string().min(1).default("hexagonal"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET precisa ter ao menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  CACHE_NAMESPACE: z.string().min(1).default("hexagonal"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(5),
  QUEUE_JOB_ATTEMPTS: z.coerce.number().int().positive().default(5),
  QUEUE_BACKOFF_MILLISECONDS: z.coerce.number().int().positive().default(1000),
  QUEUE_KEEP_COMPLETED: z.coerce.number().int().nonnegative().default(500),
  QUEUE_KEEP_FAILED: z.coerce.number().int().nonnegative().default(5000),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(180),
  READINESS_TIMEOUT_MILLISECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(2000),
});

export type Env = z.infer<typeof envSchema>;

const describeIssues = (issues: ZodIssue[]): string =>
  issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(`Configuração inválida:\n${describeIssues(parsed.error.issues)}`);
  }

  return parsed.data;
};
