import { z } from "zod";

export const notificationQuerySchema = z.object({
  status: z.enum(["pending", "read"]).optional()
});

export const pushTokenSchema = z.object({
  token: z.string().trim().min(1),
  platform: z.string().trim().min(1).default("unknown")
});
