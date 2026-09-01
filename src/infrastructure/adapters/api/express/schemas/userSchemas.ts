import { z } from "zod";

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 120;

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  email: z.string().max(MAX_EMAIL_LENGTH),
  password: z.string(),
});

export const loginSchema = z.object({
  email: z.string().max(MAX_EMAIL_LENGTH),
  password: z.string(),
});

export const listUsersQuerySchema = z.object({
  email: z.string().max(MAX_EMAIL_LENGTH).optional(),
});
