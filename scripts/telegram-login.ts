/**
 * One-shot GramJS login → prints TELEGRAM_SESSION_STRING for .env
 * Requires TELEGRAM_API_ID and TELEGRAM_API_HASH in .env (session vars empty OK).
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

async function main(): Promise<void> {
  const apiId = Number(requireEnv("TELEGRAM_API_ID"));
  const apiHash = requireEnv("TELEGRAM_API_HASH");
  if (!Number.isFinite(apiId) || apiId <= 0) {
    throw new Error("TELEGRAM_API_ID must be a positive number");
  }

  const rl = readline.createInterface({ input, output });
  const ask = (q: string): Promise<string> => rl.question(q);

  const stringSession = new StringSession("");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () =>
        (await ask("Phone (+country code): ")).trim(),
      password: async () =>
        (await ask("2FA password (Enter if none): ")).trim(),
      phoneCode: async () => (await ask("Code from Telegram: ")).trim(),
      onError: (err) => console.error(err),
    });

    const saved = stringSession.save();
    if (!saved) throw new Error("Empty session after login");

    console.log("\nAdd to .env:\n");
    console.log(`TELEGRAM_SESSION_STRING=${saved}\n`);
  } finally {
    await client.disconnect();
    rl.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
