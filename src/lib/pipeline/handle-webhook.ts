import type { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import type { NormalizedBitrixPayload } from "@/lib/bitrix/parser";
import { log } from "@/lib/logger";
import {
  getMapping,
  removeMapping,
  upsertMapping,
} from "@/lib/storage";
import {
  createMegagroup,
  inviteUsernameToChannel,
  normalizeGroupTitle,
} from "@/lib/telegram/group-service";
import { sendFileFromUrlAndVerify } from "@/lib/telegram/file-service";
import { sendTextAndVerify } from "@/lib/telegram/message-service";
import {
  verifyGroupCreated,
  verifyParticipantAdded,
} from "@/lib/telegram/verification";

function channelStoragePeerId(ch: Api.Channel): string {
  return `-100${ch.id}`;
}

export type PipelineResult = {
  ok: true;
  duplicate?: boolean;
  summary: {
    bitrixEntityId: string;
    groupPeerId: string;
    groupCreated: boolean;
    participantsOk: string[];
    participantsFailed: { username: string; error: string }[];
    messagesSent: number;
    filesSent: number;
  };
};

async function resolveChannel(
  client: TelegramClient,
  payload: NormalizedBitrixPayload
): Promise<{ channel: Api.Channel; created: boolean }> {
  const existing = await getMapping(payload.entityId);
  if (existing && !payload.forceCreate) {
    try {
      const ent = await client.getEntity(existing.telegramChatId);
      if (ent instanceof Api.Channel) {
        const v = await verifyGroupCreated(client, ent);
        if (v.ok) {
          await log.telegram("using existing mapping", {
            entityId: payload.entityId,
            peer: existing.telegramChatId,
          });
          return { channel: ent, created: false };
        }
      }
    } catch (e) {
      await log.pipeline("stale mapping", {
        entityId: payload.entityId,
        error: String(e),
      });
    }
    await removeMapping(payload.entityId);
    await log.pipeline("removed stale mapping", { entityId: payload.entityId });
  }

  const title = normalizeGroupTitle(payload.title);
  await log.telegram("creating megagroup", { entityId: payload.entityId, title });
  const channel = await createMegagroup(client, title);
  const peerId = channelStoragePeerId(channel);
  await upsertMapping(payload.entityId, {
    telegramChatId: peerId,
    title,
    updatedAt: new Date().toISOString(),
  });
  await log.telegram("group created and verified", {
    entityId: payload.entityId,
    peerId,
  });
  return { channel, created: true };
}

export async function runBitrixTelegramPipeline(
  client: TelegramClient,
  payload: NormalizedBitrixPayload
): Promise<PipelineResult> {
  await log.pipeline("pipeline start", { entityId: payload.entityId });

  const { channel, created } = await resolveChannel(client, payload);
  const peerId = channelStoragePeerId(channel);

  const participantsOk: string[] = [];
  const participantsFailed: { username: string; error: string }[] = [];

  for (const username of payload.participantUsernames) {
    try {
      await log.telegram("invite participant", { username, peerId });
      await inviteUsernameToChannel(client, channel, username);
      const v = await verifyParticipantAdded(client, channel, username);
      if (!v.ok) {
        participantsFailed.push({ username, error: v.reason });
        await log.error("participant verify failed", { username, reason: v.reason });
      } else {
        participantsOk.push(username);
        await log.telegram("participant verified", { username });
      }
    } catch (e) {
      const err = String(e);
      participantsFailed.push({ username, error: err });
      await log.error("participant invite failed", { username, error: err });
    }
  }

  let messagesSent = 0;
  const texts: string[] = [];
  if (created && payload.initialMessage?.trim()) {
    texts.push(payload.initialMessage.trim());
  }
  texts.push(...payload.followUpMessages.map((m) => m.trim()).filter(Boolean));

  for (const text of texts) {
    await log.telegram("send message", { peerId, len: text.length });
    await sendTextAndVerify(client, channel, text);
    messagesSent += 1;
  }

  let filesSent = 0;
  for (const fileUrl of payload.fileUrls) {
    await log.telegram("send file", { peerId, fileUrl });
    await sendFileFromUrlAndVerify(client, channel, fileUrl);
    filesSent += 1;
  }

  await log.pipeline("pipeline done", {
    entityId: payload.entityId,
    messagesSent,
    filesSent,
  });

  return {
    ok: true,
    summary: {
      bitrixEntityId: payload.entityId,
      groupPeerId: peerId,
      groupCreated: created,
      participantsOk,
      participantsFailed,
      messagesSent,
      filesSent,
    },
  };
}
