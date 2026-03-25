import type { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import type { EntityLike } from "telegram/define";

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/**
 * Confirms the peer resolves to a channel/supergroup we can work with.
 */
export async function verifyGroupCreated(
  client: TelegramClient,
  peer: EntityLike
): Promise<VerifyResult> {
  try {
    const ent = await client.getEntity(peer);
    if (ent instanceof Api.Channel) {
      if (!ent.megagroup && !ent.broadcast) {
        return { ok: false, reason: "channel_not_megagroup_or_broadcast" };
      }
      return { ok: true };
    }
    return { ok: false, reason: "entity_not_channel" };
  } catch (e) {
    return { ok: false, reason: `get_entity_failed: ${String(e)}` };
  }
}

export async function verifyParticipantAdded(
  client: TelegramClient,
  channel: Api.Channel,
  username: string
): Promise<VerifyResult> {
  const clean = username.replace(/^@/, "");
  try {
    const user = await client.getEntity(clean);
    await client.invoke(
      new Api.channels.GetParticipant({
        channel: await client.getInputEntity(channel),
        participant: await client.getInputEntity(user),
      })
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

export async function verifyMessageSent(
  client: TelegramClient,
  peer: EntityLike,
  messageId: number
): Promise<VerifyResult> {
  try {
    const msgs = await client.getMessages(peer, { ids: [messageId] });
    const m = msgs[0];
    if (m && m.id === messageId) return { ok: true };
    return { ok: false, reason: "message_not_found" };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

export async function verifyFileSent(
  client: TelegramClient,
  peer: EntityLike,
  messageId: number
): Promise<VerifyResult> {
  try {
    const msgs = await client.getMessages(peer, { ids: [messageId] });
    const m = msgs[0];
    if (!m || m.id !== messageId) {
      return { ok: false, reason: "message_not_found" };
    }
    if (m.media) return { ok: true };
    return { ok: false, reason: "message_has_no_media" };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}
