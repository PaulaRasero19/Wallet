import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().trim().optional().default(""),
  JWT_ACCESS_SECRET: z.string().trim().optional().default(""),
  JWT_REFRESH_SECRET: z.string().trim().optional().default(""),
  JWT_ACCESS_EXPIRES_IN: z.string().trim().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().default("30d"),
  CORS_ORIGIN: z.string().trim().default("http://localhost:8082"),
  GEMINI_API_KEY: z.string().trim().optional().default(""),
  WHATSAPP_ENABLED: z.coerce.boolean().default(false),
  WHATSAPP_ACCESS_TOKEN: z.string().trim().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().trim().optional().default(""),
  WHATSAPP_TEMPLATE_PAYMENT_REMINDER: z.string().trim().optional().default(""),
  WHATSAPP_TEMPLATE_WEEKLY_SUMMARY: z.string().trim().optional().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid server environment: ${issues}`);
}

const values = parsed.data;

export const env = {
  port: values.PORT,
  nodeEnv: values.NODE_ENV,
  mongodbUri: values.MONGODB_URI,
  jwtAccessSecret: values.JWT_ACCESS_SECRET,
  jwtRefreshSecret: values.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: values.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: values.JWT_REFRESH_EXPIRES_IN,
  corsOrigins: values.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  geminiApiKey: values.GEMINI_API_KEY,
  geminiConfigured: Boolean(values.GEMINI_API_KEY),
  whatsapp: {
    accessToken: values.WHATSAPP_ACCESS_TOKEN,
    enabled: values.WHATSAPP_ENABLED,
    paymentReminderTemplate: values.WHATSAPP_TEMPLATE_PAYMENT_REMINDER,
    phoneNumberId: values.WHATSAPP_PHONE_NUMBER_ID,
    weeklySummaryTemplate: values.WHATSAPP_TEMPLATE_WEEKLY_SUMMARY
  }
};
