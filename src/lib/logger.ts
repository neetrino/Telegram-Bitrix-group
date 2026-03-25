import { mkdir, appendFile } from "fs/promises";
import path from "path";
import { getConfig } from "@/lib/config";
import { ensureDir } from "@/lib/storage";

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logLine(
  category: string,
  message: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const cfg = getConfig();
  const dir = path.join(cfg.STORAGE_ROOT, "logs");
  await ensureDir(dir);
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    category,
    message,
    ...meta,
  });
  const file = path.join(dir, `app-${todayStamp()}.log`);
  await appendFile(file, line + "\n", "utf8");
}

export const log = {
  webhook: (message: string, meta?: Record<string, unknown>) =>
    logLine("webhook", message, meta),
  telegram: (message: string, meta?: Record<string, unknown>) =>
    logLine("telegram", message, meta),
  pipeline: (message: string, meta?: Record<string, unknown>) =>
    logLine("pipeline", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    logLine("error", message, meta),
};
