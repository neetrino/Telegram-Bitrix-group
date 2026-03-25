# Implementation plan: Bitrix24 → Next.js → Telegram (GramJS, synchronous)

## Goal

A production-oriented **Next.js App Router** backend with **no Redis, no queues, no workers, no DB**. A single HTTP request from Bitrix24 enters `POST /api/bitrix/webhook`, runs the full pipeline **synchronously** (GramJS user account), and returns an HTTP JSON response.

## Non-goals

- Bot API for group creation (use MTProto / GramJS user client).
- Admin UI, BullMQ, Redis, PostgreSQL, Prisma, SQLite, MongoDB.
- Background workers or cron for this pipeline.

## Architecture

```
Bitrix24 POST → app/api/bitrix/webhook/route.ts
              → validate secret + parse/normalize payload
              → pipeline (orchestrator)
              → TelegramClient (StringSession) + services
              → file-based mappings / logs / optional dedup
              → JSON HTTP response
```

## Modules

| Area | Path | Responsibility |
|------|------|----------------|
| HTTP | `app/api/bitrix/webhook/route.ts` | POST only, secret, call pipeline, map errors to status codes |
| Health | `app/api/health/route.ts` | Liveness (optional) |
| Config | `src/lib/config.ts` | `zod` env validation |
| Logger | `src/lib/logger.ts` | Append-only file logs under `storage/logs/` |
| Storage | `src/lib/storage.ts` | Atomic JSON read/write, paths, optional file locks (simple) |
| Bitrix | `src/lib/bitrix/validator.ts` | Zod schema for raw webhook |
| Bitrix | `src/lib/bitrix/parser.ts` | Normalize to internal `NormalizedBitrixPayload` |
| Pipeline | `src/lib/pipeline/handle-webhook.ts` | Ordered steps: mapping → group → participants → messages → files |
| Telegram | `src/lib/telegram/client.ts` | Build `TelegramClient`, connect, disconnect, session load |
| Telegram | `src/lib/telegram/verification.ts` | `verifyGroupAccessible`, `verifyParticipant`, `verifyMessage`, `verifyFileMessage` |
| Telegram | `src/lib/telegram/group-service.ts` | Create supergroup/channel, title builder |
| Telegram | `src/lib/telegram/message-service.ts` | Send text messages |
| Telegram | `src/lib/telegram/file-service.ts` | Download URL → temp file → send document/media |
| Mappings | `storage/mappings/bitrix-to-telegram.json` | `bitrixEntityId` → `{ telegramChatId, title, updatedAt }` |
| Dedup | `storage/state/webhook-dedup.json` | Optional idempotency keys (bounded list) |
| Session CLI | `scripts/telegram-login.ts` | One-shot login → `StringSession` for `.env` |

## Data flow (happy path)

1. Validate `X-Webhook-Secret` or `?secret=` (constant-time compare).
2. Parse JSON; run `validator` + `parser` → `entityId`, `title`, `participantUsernames`, `initialMessage`, `followUpMessages`, `fileUrls`, flags (`forceCreate`, etc.).
3. Idempotency: if duplicate key → return `{ ok: true, duplicate: true }`.
4. `TelegramClient`: connect; `checkAuthorization()`; on failure return 503 with clear message.
5. Resolve or create group:
   - If mapping exists and not `forceCreate` → verify group still exists via GramJS.
   - Else create supergroup, **verify** accessible as channel/supergroup, persist mapping.
6. Participants: for each username → invite/add, **verify** membership where API allows; collect partial failures.
7. Messages: initial + follow-ups; **verify** message exists in chat (by id).
8. Files: for each URL → download to `storage/temp/`, send, **verify**, delete temp.
9. Log each step; return `{ ok: true, details: { ... } }` with summary.

## Error handling

- `400` — invalid JSON / validation / normalization.
- `401` — missing/wrong webhook secret.
- `409` — optional conflict (documented in code if needed).
- `503` — Telegram not authorized / session missing (or connection failure after retries).
- `500` — unexpected errors (logged).

Partial success: HTTP `200` with `ok: true`, `partialFailures` array in body where applicable.

## Security

- Secrets only in env; `.env` gitignored; `.env.example` without secrets.
- Webhook secret required (min length enforced in config).
- File downloads: size limit, only `http(s):`, timeout, strip path traversal in saved names.
- Temp files cleaned in `finally`.

## Session handling

- Runtime: `TELEGRAM_SESSION_STRING` or `TELEGRAM_SESSION_FILE`.
- If missing/invalid: webhook returns structured error; operator runs `npm run telegram:login` locally or on server with TTY.
- Session file/string persisted; subsequent requests reuse.

## Dependencies (minimal)

- `next`, `react`, `react-dom`, `typescript`
- `telegram` (GramJS)
- `zod`
- `dotenv` (optional for scripts; Next loads `.env` automatically)

## Testing strategy

- Manual: `curl` to `/api/health`, `curl` POST webhook with secret and sample JSON.
- No mock-only pipeline; real Telegram in dev/staging.

## Deployment notes

- Synchronous pipeline may approach **serverless time limits** (e.g. Vercel). For long operations prefer Node on a VPS/Docker with adequate timeout. Document in README.

## Deliverables checklist

- [x] `IMPLEMENTATION_PLAN.md` (this file)
- [x] `TASK_PROGRESS.md`
- [x] Next.js app + route `app/api/bitrix/webhook/route.ts`
- [x] All `src/lib/*` modules listed above
- [x] `.env.example`, `README.md`
- [x] `scripts/telegram-login.ts`
- [x] `storage/` layout + `.gitkeep` files
