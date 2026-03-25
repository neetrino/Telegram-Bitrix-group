import { readFile } from "fs/promises";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { getConfig } from "@/lib/config";

export async function createTelegramClient(): Promise<TelegramClient> {
  const env = getConfig();
  let sessionString = env.TELEGRAM_SESSION_STRING;
  if (!sessionString && env.TELEGRAM_SESSION_FILE) {
    sessionString = (await readFile(env.TELEGRAM_SESSION_FILE, "utf8")).trim();
  }
  if (!sessionString) {
    throw new Error("Missing TELEGRAM_SESSION_STRING or TELEGRAM_SESSION_FILE");
  }
  const session = new StringSession(sessionString);
  const client = new TelegramClient(
    session,
    env.TELEGRAM_API_ID,
    env.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
  );
  await client.connect();
  const ok = await client.checkAuthorization();
  if (!ok) {
    await client.disconnect();
    throw new Error(
      "Telegram session is not authorized. Run: npm run telegram:login"
    );
  }
  return client;
}

export async function disconnectClient(client: TelegramClient): Promise<void> {
  try {
    await client.disconnect();
  } catch {
    /* ignore */
  }
}
