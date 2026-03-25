import { createHash } from "crypto";
import type { NormalizedBitrixPayload } from "@/lib/bitrix/parser";

export function buildWebhookIdempotencyKey(
  payload: NormalizedBitrixPayload
): string {
  const h = createHash("sha256")
    .update(
      JSON.stringify({
        entityId: payload.entityId,
        title: payload.title,
        event: payload.event,
        initialMessage: payload.initialMessage,
        followUpMessages: payload.followUpMessages,
        fileUrls: payload.fileUrls,
        forceCreate: payload.forceCreate,
      })
    )
    .digest("hex")
    .slice(0, 40);
  return `${payload.entityId}:${h}`;
}
