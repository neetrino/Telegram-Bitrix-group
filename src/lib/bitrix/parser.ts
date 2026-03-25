import type { BitrixWebhookRaw } from "@/lib/bitrix/validator";
import { getConfig } from "@/lib/config";

export type NormalizedBitrixPayload = {
  entityId: string;
  title: string;
  participantUsernames: string[];
  initialMessage?: string;
  followUpMessages: string[];
  fileUrls: string[];
  forceCreate: boolean;
  event?: string;
};

function pickEntityId(raw: BitrixWebhookRaw): string | undefined {
  if (raw.entityId !== undefined && raw.entityId !== null) {
    return String(raw.entityId);
  }
  const data = raw.data;
  if (data && typeof data === "object") {
    const fields = data.FIELDS as Record<string, unknown> | undefined;
    if (fields?.ID !== undefined) return String(fields.ID);
    if (data.ID !== undefined) return String(data.ID);
  }
  return undefined;
}

function pickTitle(raw: BitrixWebhookRaw): string {
  if (raw.title?.trim()) return raw.title.trim();
  const data = raw.data;
  if (data && typeof data === "object") {
    const fields = data.FIELDS as Record<string, unknown> | undefined;
    const t = fields?.TITLE ?? data.TITLE;
    if (typeof t === "string" && t.trim()) return t.trim();
  }
  return "Bitrix group";
}

function mergeParticipants(raw: BitrixWebhookRaw): string[] {
  const fromPayload = raw.participantUsernames ?? raw.participants ?? [];
  const defaults = getConfig()
    .TELEGRAM_DEFAULT_PARTICIPANTS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = [...defaults, ...fromPayload];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of merged) {
    const n = u.startsWith("@") ? u.slice(1) : u;
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function pickFileUrls(raw: BitrixWebhookRaw): string[] {
  const urls: string[] = [];
  if (raw.fileUrls?.length) urls.push(...raw.fileUrls);
  const files = raw.files;
  if (files?.length) {
    for (const f of files) {
      if (typeof f === "string") urls.push(f);
      else if (f && typeof f === "object" && "url" in f) urls.push(f.url);
    }
  }
  return [...new Set(urls)].filter(isHttpUrl);
}

export function normalizeBitrixWebhook(
  raw: BitrixWebhookRaw
): { ok: true; value: NormalizedBitrixPayload } | { ok: false; error: string } {
  const entityId = pickEntityId(raw);
  if (!entityId) {
    return { ok: false, error: "Missing entity id (entityId or data.FIELDS.ID)" };
  }
  const title = pickTitle(raw);
  const followUp = raw.followUpMessages?.filter(Boolean) ?? [];
  return {
    ok: true,
    value: {
      entityId,
      title,
      participantUsernames: mergeParticipants(raw),
      initialMessage: raw.initialMessage,
      followUpMessages: followUp,
      fileUrls: pickFileUrls(raw),
      forceCreate: raw.forceCreate === true,
      event: raw.event,
    },
  };
}
