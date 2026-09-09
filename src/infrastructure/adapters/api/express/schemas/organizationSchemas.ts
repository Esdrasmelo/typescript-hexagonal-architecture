import { z } from "zod";
import { DOMAIN_EVENT_NAMES } from "../../../../../core/events";

const MAX_NAME_LENGTH = 120;
const MAX_SLUG_LENGTH = 48;
const MAX_EMAIL_LENGTH = 254;
const MAX_ID_LENGTH = 64;
const MAX_AUDIT_LIMIT = 200;
const MAX_NOTIFICATION_LIMIT = 100;

const roleSchema = z.enum(["owner", "admin", "member"]);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  slug: z.string().trim().max(MAX_SLUG_LENGTH).optional(),
});

export const renameOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
});

export const organizationParamsSchema = z.object({
  slug: z.string().trim().max(MAX_SLUG_LENGTH),
});

export const memberParamsSchema = organizationParamsSchema.extend({
  userId: z.string().trim().min(1).max(MAX_ID_LENGTH),
});

export const addMemberSchema = z.object({
  email: z.string().max(MAX_EMAIL_LENGTH),
  role: roleSchema.optional(),
});

export const changeMemberRoleSchema = z.object({
  role: roleSchema,
});

export const listAuditEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_AUDIT_LIMIT).optional(),
  event: z.enum(DOMAIN_EVENT_NAMES).optional(),
  actor: z.string().trim().min(1).max(MAX_ID_LENGTH).optional(),
  before: z.coerce.date().optional(),
});

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_NOTIFICATION_LIMIT)
    .optional(),
});
