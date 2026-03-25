import type { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import { verifyGroupCreated } from "@/lib/telegram/verification";

export function normalizeGroupTitle(raw: string): string {
  const t = raw.replace(/\s+/g, " ").trim().slice(0, 255);
  return t.length > 0 ? t : "Bitrix group";
}

function channelFromUpdates(updates: Api.TypeUpdates): Api.Channel | null {
  if ("chats" in updates && updates.chats?.length) {
    for (const c of updates.chats) {
      if (c instanceof Api.Channel) return c;
    }
  }
  return null;
}

export async function createMegagroup(
  client: TelegramClient,
  title: string
): Promise<Api.Channel> {
  const t = normalizeGroupTitle(title);
  const updates = await client.invoke(
    new Api.channels.CreateChannel({
      title: t,
      about: "",
      megagroup: true,
      broadcast: false,
    })
  );
  const ch = channelFromUpdates(updates);
  if (!ch) {
    throw new Error("CreateChannel did not return a channel in updates");
  }
  const v = await verifyGroupCreated(client, ch);
  if (!v.ok) {
    throw new Error(`Group verification failed: ${v.reason}`);
  }
  return ch;
}

export async function inviteUsernameToChannel(
  client: TelegramClient,
  channel: Api.Channel,
  username: string
): Promise<void> {
  const clean = username.replace(/^@/, "");
  const user = await client.getEntity(clean);
  await client.invoke(
    new Api.channels.InviteToChannel({
      channel: await client.getInputEntity(channel),
      users: [user],
    })
  );
}
