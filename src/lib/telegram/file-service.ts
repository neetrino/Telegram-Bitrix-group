import { writeFile, unlink } from "fs/promises";
import path from "path";
import type { TelegramClient } from "telegram";
import type { EntityLike } from "telegram/define";
import { getConfig } from "@/lib/config";
import { ensureDir } from "@/lib/storage";
import { verifyFileSent } from "@/lib/telegram/verification";

function safeBasenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "file";
    return seg.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
  } catch {
    return "file";
  }
}

export async function downloadUrlToTemp(url: string): Promise<string> {
  const cfg = getConfig();
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    throw new Error("Only http(s) URLs are allowed");
  }
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(cfg.FILE_DOWNLOAD_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }
  const len = res.headers.get("content-length");
  if (len && Number(len) > cfg.FILE_DOWNLOAD_MAX_BYTES) {
    throw new Error("File too large (content-length)");
  }
  const ab = await res.arrayBuffer();
  if (ab.byteLength > cfg.FILE_DOWNLOAD_MAX_BYTES) {
    throw new Error("File too large");
  }
  const root = path.resolve(process.cwd(), cfg.STORAGE_ROOT, "temp");
  await ensureDir(root);
  const name = `${Date.now()}-${safeBasenameFromUrl(url)}`;
  const dest = path.join(root, name);
  await writeFile(dest, Buffer.from(ab));
  return dest;
}

export async function sendFileFromUrlAndVerify(
  client: TelegramClient,
  peer: EntityLike,
  url: string
): Promise<{ messageId: number }> {
  let localPath: string | undefined;
  try {
    localPath = await downloadUrlToTemp(url);
    const sent = await client.sendFile(peer, { file: localPath });
    const rawId = sent.id;
    const id =
      typeof rawId === "bigint"
        ? Number(rawId)
        : typeof rawId === "number"
          ? rawId
          : Number(rawId);
    const v = await verifyFileSent(client, peer, id);
    if (!v.ok) {
      throw new Error(`File send verification failed: ${v.reason}`);
    }
    return { messageId: id };
  } finally {
    if (localPath) {
      await unlink(localPath).catch(() => undefined);
    }
  }
}
