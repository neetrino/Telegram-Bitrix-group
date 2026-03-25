import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { getConfig } from "@/lib/config";

export function storageRootAbs(): string {
  return path.resolve(process.cwd(), getConfig().STORAGE_ROOT);
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw e;
  }
}

export async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, filePath);
}

export function mappingsFilePath(): string {
  return path.join(storageRootAbs(), "mappings", "bitrix-to-telegram.json");
}

export type MappingRecord = {
  telegramChatId: string;
  title: string;
  updatedAt: string;
};

export type MappingsFile = {
  version: 1;
  mappings: Record<string, MappingRecord>;
};

export async function loadMappings(): Promise<MappingsFile> {
  const p = mappingsFilePath();
  const data = await readJsonFile<MappingsFile>(p);
  if (!data) {
    return { version: 1, mappings: {} };
  }
  if (data.version !== 1 || typeof data.mappings !== "object") {
    return { version: 1, mappings: {} };
  }
  return data;
}

export async function saveMappings(file: MappingsFile): Promise<void> {
  await writeJsonAtomic(mappingsFilePath(), file);
}

export async function upsertMapping(
  bitrixEntityId: string,
  record: MappingRecord
): Promise<void> {
  const cur = await loadMappings();
  cur.mappings[bitrixEntityId] = record;
  await saveMappings(cur);
}

export async function getMapping(
  bitrixEntityId: string
): Promise<MappingRecord | null> {
  const cur = await loadMappings();
  return cur.mappings[bitrixEntityId] ?? null;
}

export async function removeMapping(bitrixEntityId: string): Promise<void> {
  const cur = await loadMappings();
  delete cur.mappings[bitrixEntityId];
  await saveMappings(cur);
}

export type DedupFile = { keys: { key: string; at: string }[] };

export function dedupFilePath(): string {
  return path.join(storageRootAbs(), "state", "webhook-dedup.json");
}

/** Returns true if this idempotency key already completed successfully (skip replay). */
export async function isWebhookAlreadyCompleted(key: string): Promise<boolean> {
  const p = dedupFilePath();
  const file = await readJsonFile<DedupFile>(p);
  if (!file?.keys?.length) return false;
  return file.keys.some((k) => k.key === key);
}

/** Call after successful pipeline so Bitrix retries with same payload are no-ops. */
export async function markWebhookCompleted(key: string): Promise<void> {
  const max = getConfig().WEBHOOK_DEDUP_MAX;
  const p = dedupFilePath();
  let file = await readJsonFile<DedupFile>(p);
  if (!file || !Array.isArray(file.keys)) {
    file = { keys: [] };
  }
  if (file.keys.some((k) => k.key === key)) return;
  file.keys.push({ key, at: new Date().toISOString() });
  if (file.keys.length > max) {
    file.keys = file.keys.slice(-max);
  }
  await writeJsonAtomic(p, file);
}
