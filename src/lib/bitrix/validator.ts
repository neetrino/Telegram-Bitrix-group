import { z } from "zod";

/**
 * Accepts flexible Bitrix outbound webhook shapes; unknown fields preserved via passthrough for parser.
 */
export const bitrixWebhookSchema = z
  .object({
    event: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    entityId: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    participantUsernames: z.array(z.string()).optional(),
    participants: z.array(z.string()).optional(),
    initialMessage: z.string().optional(),
    followUpMessages: z.array(z.string()).optional(),
    fileUrls: z.array(z.string()).optional(),
    files: z
      .array(z.union([z.string(), z.object({ url: z.string() })]))
      .optional(),
    forceCreate: z.boolean().optional(),
  })
  .passthrough();

export type BitrixWebhookRaw = z.infer<typeof bitrixWebhookSchema>;
