# Minimal P0 Must-have checklist
(Next.js + (Next API или NestJS) + Neon + Upstash опционально)

> [!info] Кто что делает
> **🤖 В коде** — реализует AI / разработчик в репозитории. Сначала закрывай эти пункты (отдаёшь задачу AI).  
> **👤 Вручную** — настройки в панелях (Vercel, Cloudflare, Neon, Clerk и т.д.). Делаешь ты после того, как код готов.

---

## 1. Edge / Network — [[1 Edge-Network защита (периметр)]]
*Сначала 🤖, в конце 👤*

* [ ] 🤖 **1.5** Security headers: X-Content-Type-Options, X-Frame-Options, CSP baseline (Code/Vercel)
* [ ] 🤖 **1.4** Rate limit auth/API/webhooks/forms в коде (если не через Cloudflare)
* [ ] 👤 **1.1** HTTPS + HSTS (Cloudflare/Vercel)
* [ ] 👤 **1.2** WAF managed rules ON (Cloudflare)
* [ ] 👤 **1.3** DDoS protection ON (Cloudflare)

---

## 2. Auth + Sessions — [[2 Auth + Sessions (самая любимая точка атаки)]]
*Сначала 🤖, в конце 👤*

* [ ] 🤖 **2.2** Secure cookies + session TTL/rotation (Clerk/Auth.js)
* [ ] 🤖 **2.3** CSRF protection (Code)
* [ ] 🤖 **2.4** RBAC server-side (Code)
* [ ] 🤖 **2.7** Logout invalidates session/token (Code/Clerk/Auth.js)
* [ ] 👤 **2.1** ADR: схема auth (Clerk/Auth.js) (Docs)
* [ ] 👤 **2.5** Admin MFA mandatory (Clerk/Policy)
* [ ] 👤 **2.6** Password policy if not OAuth-only (Docs/Policy)

---

## 3. API безопасность — [[3 API безопасность (Next API - Nest)]]
*Всё в коде 🤖*

* [ ] 🤖 **3.1** Input validation (Code)
* [ ] 🤖 **3.1a** XSS: sanitize user content, no unsafe HTML render (Code)
* [ ] 🤖 **3.2** No stack traces in prod (Code/Vercel)
* [ ] 🤖 **3.2a** No sensitive data in error responses (Code)
* [ ] 🤖 **3.3** Strict CORS (Code)
* [ ] 🤖 **3.4** Idempotency for critical POST (Code/Neon)
* [ ] 🤖 **3.5** Webhook signature + replay protection (Code)
* [ ] 🤖 **3.6** Parameterized queries, no raw SQL with user input (Code)

---

## 4. Data / DB (Neon) — [[4 Data-DB (Neon Postgres)]]
*Сначала 🤖, в конце 👤*

* [ ] 🤖 **4.2** DB pooling + connection limits (Neon/Code)
* [ ] 👤 **4.1** DB TLS required (Neon/Vercel env)
* [ ] 👤 **4.3** DB least privilege (Neon SQL)
* [ ] 👤 **4.4** Backups + restore test (Neon)

---

## 5. Secrets & Config — [[5 Secrets & Config hygiene]]
*Сначала 🤖, в конце 👤*

* [ ] 🤖 **5.3** .env in .gitignore, no secrets in repo/code (CI/Repo)
* [ ] 👤 **5.1** Secrets only in env, separated by envs (Vercel/CI)
* [ ] 👤 **5.2** Rotation runbook exists (Docs)

---

## 6. Observability — [[6 Observability (иначе ты слепой)]]
*Сначала 🤖, в конце 👤*

* [ ] 🤖 **6.1** Logs + request-id (Code/Vercel)
* [ ] 🤖 **6.3** No tokens/PII in logs (Code/Rule)
* [ ] 👤 **6.2** Alerts for 5xx/latency/webhooks/db (Obs tool)

---

## 7. Redis (Upstash) — [[7 Upstash Redis (если используется)]]
*Сначала 🤖, в конце 👤*

* [ ] 🤖 **7.2** Redis TTL + namespaces (Code)
* [ ] 🤖 **7.3** No PII/secrets in Redis (Rule)
* [ ] 👤 **7.1** Redis TLS (Upstash)

---

## 8. Dependencies — [[8 Dependency scanning]]
*🤖 в CI и/или 👤 в GitHub*

* [ ] 🤖👤 **8.1** Dependency scanning in CI (npm audit / Dependabot/Renovate)

---
> **Уровень 2:** расширенный контроль — раздел B (Безопасность) и C (Секреты) в «Проектный Quality Checklist».
