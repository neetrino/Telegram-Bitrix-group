# Neon — Ամբողջական կարգավորում

> Neon — serverless PostgreSQL branching, autoscaling և ավտոմատ բեքափներով։

---

## 📋 ԲՈՎԱՆԴԱԿՈՒԹՅՈՒՆ

1. [Հաշվի ստեղծում](#ստեղծում-ակաունտ)
2. [Նախագծի ստեղծում](#նախագծի-ստեղծում)
3. [Database Branching](#branching)
4. [Connection Strings](#connection-strings)
5. [Prisma Integration](#prisma)
6. [Vercel Integration](#vercel-integration)
7. [Backup & Restore](#backup-restore)
8. [Autoscaling](#autoscaling)
9. [Monitoring](#monitoring)
10. [Security](#security)
11. [CLI](#cli)
12. [Checklist](#checklist)

---

## 1. Հաշվի ստեղծում {#ստեղծում-ակաունտ}

### Քայլեր.

1. Անցի՛ր [neon.tech](https://neon.tech)
2. "Sign Up" → GitHub / Google / Email
3. Ընտրի՛ր պլան.
   - **Free** — 0.5 GB storage, 1 project, branching
   - **Launch** — $19/ամիս, 10 GB, 10 projects
   - **Scale** — $69/ամիս, 50 GB, unlimited projects

### Free tier սահմանափակումներ.

| Ռեսուրս | Սահման |
|---------|--------|
| Storage | 0.5 GB |
| Compute | 191.9 hours/month |
| Projects | 1 |
| Branches | 10 |
| History | 7 days |

---

## 2. Նախագծի ստեղծում {#նախագծի-ստեղծում}

### UI-ով.

1. Dashboard → "New Project"
2. Կարգավորումներ.
   - **Name.** project-name
   - **Postgres Version.** 16 (խորհուրդ տրվող)
   - **Region.** US East (մոտ Vercel-ին)
   - **Compute size.** 0.25 CU (Free) կամ ավելի

### Regions.

| Region | Կոդ | Օգտագործել |
|--------|-----|-------------|
| US East (N. Virginia) | aws-us-east-1 | Vercel (default) |
| US East (Ohio) | aws-us-east-2 | Alternative US |
| US West (Oregon) | aws-us-west-2 | West Coast users |
| Europe (Frankfurt) | aws-eu-central-1 | EU users |
| Asia Pacific (Singapore) | aws-ap-southeast-1 | APAC users |

### Ստեղծումից հետո.

- Ավտոմատ ստեղծվում է `main` branch
- Ավտոմատ ստեղծվում է database `neondb`
- Ավտոմատ ստեղծվում է role (username)

---

## 3. Database Branching {#branching}

> Neon-ի գլխավոր ֆիչը — database branches ինչպես git branches։

### Կոնցեպցիա.

```
main (production)
├── develop (staging)
├── preview-pr-123 (PR preview)
├── preview-pr-456 (PR preview)
└── dev-feature-auth (local dev)
```

### Branch ստեղծում UI-ով.

1. Project → Branches → "New Branch"
2. Կարգավորումներ.
   - **Name.** develop
   - **Parent.** main
   - **Include data.** Yes (պատճենել տվյալները)
   - **Compute.** Shared կամ Dedicated

### Branch ստեղծում CLI-ով.

```bash
# CLI-ի տեղադրում
npm install -g neonctl

# Մուտք
neonctl auth

# Branch ստեղծել
neonctl branches create --name develop --project-id <project-id>

# Branch ստեղծել որոշակի պահի տվյալներով
neonctl branches create --name restore-point --parent main --point-in-time "2024-01-15T10:00:00Z"
```

### Branch-երի տիպեր.

| Տիպ | Նշանակություն | Compute |
|-----|---------------|---------|
| main | Production | Dedicated (խորհուրդ տրվող) |
| develop | Staging/QA | Shared |
| preview-* | PR previews | Shared, scale to zero |
| dev-* | Տեղական զարգացում | Shared, scale to zero |

### Ավտոմատ preview branches (Vercel).

Vercel Integration-ի դեպքում.
- Յուրաքանչյուր PR ավտոմատ ստանում է իր database branch-ը
- Branch-ը ջնջվում է PR-ը փակելիս

---

## 4. Connection Strings {#connection-strings}

### Ձևաչափ.

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Connection string-երի տիպեր.

| Տիպ | Օգտագործում | Օրինակ պարամետր |
|-----|--------------|-------------------|
| Pooled | Ծրագիր (Next.js, NestJS) | `?pgbouncer=true` |
| Direct | Միգրացիաներ (Prisma migrate) | Առանց pgbouncer |

### Որտեղ գտնել.

1. Project → Connection Details
2. Ընտրի՛ր branch
3. Ընտրի՛ր տիպ (Pooled / Direct)
4. Պատճենի՛ր connection string

### Օրինակ.

```bash
# Pooled (ծրագրի համար)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct (միգրացիաների համար)
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

---

## 5. Prisma Integration {#prisma}

### schema.prisma.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### .env.local.

```bash
# Pooled connection (ծրագրի համար)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct connection (միգրացիաների համար)
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Միգրացիաներ.

```bash
# Միգրացիա ստեղծել
npx prisma migrate dev --name init

# Կիրառել միգրացիաներ (production)
npx prisma migrate deploy

# Ստեղծել կլիենտ
npx prisma generate
```

### Singleton Prisma Client-ի համար.

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 6. Vercel Integration {#vercel-integration}

### Միացում.

1. Vercel Dashboard → Project → Settings → Integrations
2. "Browse Marketplace" → գտի՛ր "Neon"
3. "Add Integration"
4. Ինքնորոշել Neon
5. Ընտրի՛ր Neon project
6. Ընտրի՛ր Vercel project(s)
7. Կարգավորի՛ր.
   - **Production branch.** main
   - **Preview branches.** ավտոմատ ստեղծել

### Ինչ է ավտոմատ տեղի ունենում.

1. **Environment Variables** ավելացվում են Vercel-ում.
   - `DATABASE_URL` (pooled)
   - `DATABASE_URL_UNPOOLED` (direct)

2. **Preview Deployments.**
   - PR ստեղծվում է → Neon branch ստեղծվում է
   - PR փակվում է → Neon branch ջնջվում է
   - Յուրաքանչյուր preview ստանում է մեկուսացված ԲԴ

### Preview-ի համար branch-ի կարգավորում.

```json
// Neon Dashboard → Integrations → Vercel
{
  "preview_branch_parent": "main",  // կամ "develop"
  "include_data": true               // պատճենել տվյալները
}
```

---

## 7. Backup & Restore {#backup-restore}

### Ավտոմատ բեքափներ.

Neon-ը ավտոմատ պահպանում է փոփոխությունների պատմությունը.

| Պլան | History Retention |
|------|-------------------|
| Free | 7 days |
| Launch | 7 days |
| Scale | 30 days |

### Point-in-Time Recovery (PITR).

```bash
# Branch ստեղծել ժամանակի որոշակի պահի համար
neonctl branches create \
  --name restore-2024-01-15 \
  --parent main \
  --point-in-time "2024-01-15T10:00:00Z"
```

### UI-ով.

1. Project → Branches
2. "Create Branch"
3. Parent: main
4. Միացրու՛ "Point in time"
5. Ընտրի՛ր ամսաթիվ/ժամ

### Restore production-ում.

```bash
# 1. Ստեղծել վերականգնված branch
neonctl branches create --name restored --parent main --point-in-time "2024-01-15T10:00:00Z"

# 2. Ստուգել տվյալները restored branch-ում

# 3. Եթե ամեն ինչ OK — փոխանցել ծրագիրը restored branch-ին
# (թարմացնել DATABASE_URL Vercel-ում)

# 4. Կամ. branch-եր անվանափոխել
neonctl branches rename main main-broken
neonctl branches rename restored main
```

### Տվյալների export.

```bash
# pg_dump Neon connection-ով
pg_dump "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" > backup.sql

# Վերականգնում
psql "postgresql://..." < backup.sql
```

---

## 8. Autoscaling {#autoscaling}

### Compute Units (CU).

| CU | vCPU | RAM | Օգտագործում |
|----|------|-----|--------------|
| 0.25 | 0.25 | 1 GB | Dev/Preview |
| 0.5 | 0.5 | 2 GB | Small prod |
| 1 | 1 | 4 GB | Medium prod |
| 2 | 2 | 8 GB | Large prod |
| 4+ | 4+ | 16+ GB | High traffic |

### Կարգավորում.

1. Project → Settings → Compute
2. Կարգավորի՛ր.
   - **Min compute.** 0 (scale to zero) կամ 0.25
   - **Max compute.** 2 (կամ ավելի)
   - **Suspend after.** 5 րոպե անակտիվություն

### Scale to Zero.

- Dev/Preview branches-ը կարող են անցնել sleep
- Առաջին հարցումը «արթնացնում է» compute (~300-500ms cold start)
- Production-ի համար խորհուրդ է min 0.25 cold start-ից խուսափելու համար

### Autosuspend կարգավորում.

```bash
# CLI-ով
neonctl branches update main --compute-config '{"suspend_timeout": 300}'
```

---

## 9. Monitoring {#monitoring}

### Dashboard մետրիկներ.

- **Connections.** ակտիվ միացումներ
- **Compute time.** CPU-ի օգտագործում
- **Storage.** տվյալների չափ
- **Data transfer.** տրաֆիկի ծավալ

### Query Insights.

1. Project → Monitoring → Query Insights
2. Տեսանելի են.
   - Դանդաղ հարցումներ
   - Հաճախակի հարցումներ
   - Query plans

### Alerts (Pro+).

1. Project → Settings → Alerts
2. Կարգավորի՛ր.
   - Storage > 80%
   - Compute time > threshold
   - Connection errors

### Լոգավորում.

```sql
-- Միացնել դանդաղ հարցումների լոգավորումը
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 վայրկյան
```

---

## 10. Security {#security}

### IP Allow List (Pro+).

1. Project → Settings → IP Allow
2. Ավելացրու՛ թույլատրված IP-ներ.
   - Vercel IP ranges
   - Քո գրասենյակ/VPN
   - CI/CD servers

### Roles & Permissions.

```sql
-- Read-only դեր ստեղծել
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE neondb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

### SSL.

- Միշտ միացված (sslmode=require)
- Չի կարելի անջատել

### Branch Protection.

1. Project → Settings → Branches
2. Պաշտպանի՛ր "main".
   - Require confirmation for delete
   - Prevent direct writes (միայն միգրացիաներով)

---

## 11. CLI {#cli}

### Տեղադրում.

```bash
npm install -g neonctl
```

### Հիմնական հրամաններ.

```bash
# Ինքնորոշում
neonctl auth

# Նախագծեր
neonctl projects list
neonctl projects create --name my-project

# Branches
neonctl branches list --project-id <id>
neonctl branches create --name develop --project-id <id>
neonctl branches delete develop --project-id <id>

# Connection string
neonctl connection-string main --project-id <id>
neonctl connection-string main --project-id <id> --pooled

# Database operations
neonctl databases list --project-id <id> --branch main
neonctl databases create --name testdb --project-id <id> --branch main

# SQL execution
neonctl query "SELECT version();" --project-id <id> --branch main
```

### CI-ում օգտագործում.

```yaml
# .github/workflows/migrate.yml
- name: Install Neon CLI
  run: npm install -g neonctl

- name: Run migrations
  env:
    NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
  run: |
    export DATABASE_URL=$(neonctl connection-string main --project-id $PROJECT_ID)
    npx prisma migrate deploy
```

---

## ✅ Checklist {#checklist}

### Նախնական կարգավորում.

- [ ] Հաշիվ ստեղծված
- [ ] Project ստեղծված
- [ ] Region ընտրված (մոտ Vercel-ին)
- [ ] Main branch կարգավորված

### Branches.

- [ ] main — production
- [ ] develop — staging (ընտրովի)
- [ ] Preview branches Vercel Integration-ով

### Connections.

- [ ] DATABASE_URL (pooled) ծրագրի համար
- [ ] DIRECT_URL միգրացիաների համար
- [ ] Connection strings Vercel-ում

### Prisma.

- [ ] schema.prisma կարգավորված
- [ ] directUrl ավելացված
- [ ] Սկզբնական միգրացիա ստեղծված

### Vercel Integration.

- [ ] Integration միացված
- [ ] Production branch = main
- [ ] Preview branches ավտոմատ

### Backup & Recovery.

- [ ] Հասկանում եք ինչպես օգտագործել PITR
- [ ] Գիտեք ինչպես ստեղծել restore branch
- [ ] History retention բավարար է

### Security.

- [ ] Connection strings-ը կոդում չեն
- [ ] IP Allow List (եթե Pro+)
- [ ] Branch protection main-ի համար

### Performance.

- [ ] Compute size համապատասխանում է բեռին
- [ ] Scale to zero dev branches-ի համար
- [ ] Min compute > 0 production-ի համար (եթե կրիտիկական)

---

**Տարբերակ.** 1.0
