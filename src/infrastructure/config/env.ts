import { z, ZodIssue } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
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
