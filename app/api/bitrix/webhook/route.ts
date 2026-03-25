import { NextRequest, NextResponse } from "next/server";
import { bitrixWebhookSchema } from "@/lib/bitrix/validator";
import { normalizeBitrixWebhook } from "@/lib/bitrix/parser";
import { getConfig } from "@/lib/config";
import { log } from "@/lib/logger";
import { runBitrixTelegramPipeline } from "@/lib/pipeline/handle-webhook";
import { compareSecretConstantTime } from "@/lib/security/compare-secret";
import { isWebhookAlreadyCompleted, markWebhookCompleted } from "@/lib/storage";
import { createTelegramClient, disconnectClient } from "@/lib/telegram/client";
import { buildWebhookIdempotencyKey } from "@/lib/webhook/idempotency";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function extractSecret(req: NextRequest): string | null {
  const header = req.headers.get("x-webhook-secret");
  if (header) return header;
  return new URL(req.url).searchParams.get("secret");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let client: Awaited<ReturnType<typeof createTelegramClient>> | undefined;
  try {
    getConfig();
  } catch (e) {
    await log.error("config invalid", { error: String(e) });
    return NextResponse.json(
      { error: "Server misconfiguration", detail: String(e) },
      { status: 503 }
    );
  }

  const secret = extractSecret(req);
  const expected = getConfig().BITRIX_WEBHOOK_SECRET;
  if (!secret || !compareSecretConstantTime(secret, expected)) {
    await log.webhook("unauthorized", {});
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bitrixWebhookSchema.safeParse(body);
  if (!parsed.success) {
    await log.webhook("validation failed", {
      issues: parsed.error.flatten(),
    });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const normalized = normalizeBitrixWebhook(parsed.data);
  if (!normalized.ok) {
    await log.webhook("normalize failed", { reason: normalized.error });
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const idem = buildWebhookIdempotencyKey(normalized.value);
  if (await isWebhookAlreadyCompleted(idem)) {
    await log.webhook("duplicate ignored", { idempotencyKey: idem });
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await log.webhook("accepted", {
    entityId: normalized.value.entityId,
    event: normalized.value.event,
  });

  try {
    client = await createTelegramClient();
  } catch (e) {
    const msg = String(e);
    await log.error("telegram connect failed", { error: msg });
    return NextResponse.json(
      {
        error: "Telegram session not ready",
        detail: msg,
        hint: "Run: npm run telegram:login and set TELEGRAM_SESSION_STRING or TELEGRAM_SESSION_FILE",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runBitrixTelegramPipeline(client, normalized.value);
    await markWebhookCompleted(idem);
    return NextResponse.json(result);
  } catch (e) {
    const msg = String(e);
    await log.error("pipeline failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (client) await disconnectClient(client);
  }
}
