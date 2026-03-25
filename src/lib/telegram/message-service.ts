import type { TelegramClient } from "telegram";
import type { EntityLike } from "telegram/define";
import { verifyMessageSent } from "@/lib/telegram/verification";

export async function sendTextAndVerify(
  client: TelegramClient,
  peer: EntityLike,
  text: string
): Promise<{ messageId: number }> {
  const msg = await client.sendMessage(peer, { message: text });
  const rawId = msg.id;
  const id =
    typeof rawId === "bigint"
      ? Number(rawId)
      : typeof rawId === "number"
        ? rawId
        : Number(rawId);
  const v = await verifyMessageSent(client, peer, id);
  if (!v.ok) {
    throw new Error(`Message send verification failed: ${v.reason}`);
  }
  return { messageId: id };
}
