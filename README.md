# Bitrix24 → Telegram (GramJS), synchronous Next.js backend

Production-oriented **Next.js App Router** API only: **Bitrix24** sends a webhook, this service runs the full **GramJS (MTProto user)** pipeline **in the same request** — no Redis, no BullMQ, no worker process, no database.

## Flow

```
POST /api/bitrix/webhook → validate → GramJS → file logs + JSON mapping → HTTP response
```

## Requirements

- Node.js 20+
- Telegram **user** API (`api_id` / `api_hash` from [my.telegram.org](https://my.telegram.org))
- A valid **StringSession** (not a bot token)

## Setup

1. `cp .env.example .env` and fill secrets.

2. Obtain a session (once):

   ```bash
   npm run telegram:login
   ```

   Paste the printed `TELEGRAM_SESSION_STRING` into `.env`.

3. Install and run:

   ```bash
   npm ci
   npm run build
   npm start
   ```

   Development:

   ```bash
   npm run dev
   ```

## HTTP

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| POST | `/api/bitrix/webhook` | Bitrix outbound webhook (`X-Webhook-Secret` or `?secret=`) |

### Webhook JSON (examples)

Minimal custom shape:

```json
{
  "entityId": "deal-123",
  "title": "Acme deal",
  "participantUsernames": ["teammate"],
  "initialMessage": "Group created from Bitrix",
  "followUpMessages": ["Update: stage changed"],
  "fileUrls": ["https://example.com/doc.pdf"],
  "forceCreate": false
}
```

Bitrix-style shapes with `data.FIELDS.ID` / `TITLE` are also accepted (see `src/lib/bitrix/parser.ts`).

## Storage

- `storage/mappings/bitrix-to-telegram.json` — Bitrix entity id → Telegram peer id  
- `storage/state/webhook-dedup.json` — completed idempotency keys  
- `storage/logs/app-*.log` — JSON lines  
- `storage/temp/` — short-lived downloads for file send  

## Security

- Never commit `.env` or session strings.  
- Use HTTPS in production; rotate `BITRIX_WEBHOOK_SECRET` periodically.

## Limits

Long-running webhooks may hit **serverless timeouts** (e.g. Vercel). For heavy Telegram work, run **Node on a VPS/Docker** with an appropriate HTTP timeout.

## Docs

- `IMPLEMENTATION_PLAN.md` — architecture  
- `TASK_PROGRESS.md` — delivery checklist  

## License

See `LICENSE` (repository default).
