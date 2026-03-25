import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  STORAGE_ROOT: z.string().default("./storage"),
  BITRIX_WEBHOOK_SECRET: z.string().min(8),
  TELEGRAM_API_ID: z.coerce.number().int().positive(),
  TELEGRAM_API_HASH: z.string().min(8),
  TELEGRAM_SESSION_STRING: z.string().optional(),
  TELEGRAM_SESSION_FILE: z.string().optional(),
  /** Comma-separated @usernames; merged with payload participants */
  TELEGRAM_DEFAULT_PARTICIPANTS: z.string().optional().default(""),
  WEBHOOK_DEDUP_MAX: z.coerce.number().int().positive().default(2000),
  FILE_DOWNLOAD_MAX_BYTES: z.coerce.number().int().positive().default(50_000_000),
  FILE_DOWNLOAD_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  if (!parsed.data.TELEGRAM_SESSION_STRING && !parsed.data.TELEGRAM_SESSION_FILE) {
    throw new Error("Set TELEGRAM_SESSION_STRING or TELEGRAM_SESSION_FILE");
  }
  cached = parsed.data;
  return parsed.data;
}

export function resetConfigCache(): void {
  cached = null;
}
