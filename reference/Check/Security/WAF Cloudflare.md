___
# REG-SEC-EDGE-001

## Cloudflare-first WAF & Edge Security Standard (Vercel + Render)

**Статус:** обязательный для всех публичных проектов  
**Цель:** единый периметр безопасности (WAF, rate limit, bot, DDoS, TLS) независимо от того, где живёт приложение

---

## 0) Принцип архитектуры

**Единственный вход в проект:**  
**Интернет → Cloudflare (proxy ON) → origin (Vercel/Render/VPS)**

**Запрещено:** напрямую светить origin-домены/URL пользователю (если возможно).  
**Разрешено:** origin доступен только как “за Cloudflare”.

---

## 1) DNS и TLS (обязательная база)

### 1.1 DNS в Cloudflare

- Все публичные записи сайта должны быть **Proxied (оранжевая тучка ON)**:
    
    - `@` (apex)
        
    - `www`
        
    - `api` (если отдельный сабдомен)
        
    - любые публичные сервисы (если они должны быть публичны)
        

**Запрещено:** “DNS only” для публичных endpoint’ов (кроме редких случаев типа почты).

### 1.2 SSL/TLS режим

Cloudflare → SSL/TLS:

- **Mode: Full (strict)**
    
- Origin должен иметь валидный сертификат:
    
    - Vercel: ок
        
    - Render: ок
        
    - VPS: поставить origin cert (Cloudflare Origin Certificate) или Let’s Encrypt
        

### 1.3 HSTS (после проверки)

Cloudflare → SSL/TLS → Edge Certificates:

- Включить **HSTS** (рекомендуется после теста):
    
    - Start: `max-age=31536000`
        
    - Include subdomains: по готовности
        
    - Preload: только когда уверен на 100%
        

---

## 2) WAF: Managed Rules (обязательное)

Cloudflare → Security → WAF

### 2.1 Включить Managed Rulesets

Обязательные наборы:

1. **Cloudflare Managed Ruleset**
    
2. **OWASP Core Ruleset (CRS)**
    

**Стартовая политика действий**

- Первый запуск: **Managed Challenge** для “высокого риска”, чтобы не ломать легитимный трафик.
    
- Через 3–7 дней логов: перевести самые шумные угрозы в **Block**.
    

### 2.2 Логи и тюнинг

Обязательное правило:

- Любой блок/челлендж, который задел оплату/авторизацию/вебхуки, фиксится через исключение или точечное правило (см. раздел 6).
    

---

## 3) Rate Limiting: единый стандарт лимитов

Cloudflare → Security → WAF → Rate limiting rules  
**Цель:** ломаем экономику ботов/абьюза и защищаем биллинг Vercel/Render.

### 3.1 Классы endpoint’ов

Разделяем на группы:

**A. Auth / identity (самое атакуемое)**

- `/api/auth/*`
    
- `/login`, `/register`, `/forgot-password`, `/reset-password`
    
- magic links, OTP verify endpoints
    

**B. Public forms (лиды, подписки, контакты)**

- `/api/contact`, `/api/lead`, `/api/subscribe`
    

**C. “Дорогие” endpoints**

- поиск, фильтры, генерации, отчёты
    
- любые endpoints с внешними вызовами (LLM, платежи, сторонние API)
    

**D. Webhooks**

- `/api/webhooks/*` (Stripe/PayPal/…)
    
- `/api/clerk/webhook` (пример)
    

**E. Admin**

- `/admin/*`, `/api/admin/*`
    

---

### 3.2 Базовые лимиты (рекомендуемые значения по умолчанию)

> Это старт. Потом корректируется по логам, но “ниже минимума” без причины нельзя.

**A) Auth**

- `POST /api/auth/login` или аналог: **10 req / 1 min / IP**
    
- `POST /api/auth/register`: **5 req / 10 min / IP**
    
- `POST /api/auth/reset/forgot`: **5 req / 10 min / IP**
    
- `POST /api/auth/verify-otp`: **20 req / 5 min / IP**
    

**Action:** Managed Challenge (потом Block, если явно бот)

**B) Public forms**

- `POST /api/contact|lead|subscribe`: **10 req / 10 min / IP**  
    **Action:** Managed Challenge
    

**C) Дорогие endpoints**

- `GET /api/search` и аналоги: **120 req / 1 min / IP**
    
- “очень дорогие” (LLM, heavy compute): **30 req / 1 min / IP**  
    **Action:** Managed Challenge, при систематике Block
    

**D) Webhooks**

- **НЕ лимитить как обычных пользователей.**
    
- Делать отдельное правило:
    
    - Allow если `User-Agent/headers` соответствуют провайдеру **или** запрос подписан (см. раздел 5.3)
        
    - Иначе challenge/block
        

**E) Admin**

- `/admin/*`:
    
    - по умолчанию **Block**, затем **Allowlist** по IP/VPN/Access (см. раздел 4 и 6)
        

---

## 4) Bot protection (обязательное)

Cloudflare → Security → Bots (если доступно на плане)

**Стандарт:**

- Включить защиту от ботов
    
- Для “подозрительных” запросов:
    
    - challenge по плохим User-Agent
        
    - challenge по аномальному поведению (высокая частота, однотипные пути)
        

**Разрешённые боты:**

- поисковые боты (если SEO нужен)
    
- мониторинг (UptimeRobot и т.п.) при whitelist
    

---

## 5) Правила безопасности уровня приложения, но фиксируем в регламенте

Cloudflare не заменяет код. Cloudflare делает так, чтобы сервер не плакал.

### 5.1 CORS

**Backend (Render Nest или Vercel API)**

- Разрешать origin только твоим доменам:
    
    - `https://example.com`
        
    - `https://www.example.com`
        
    - staging домены по необходимости
        
- Запрещено `*` для приватных API/сессионных cookie.
    

### 5.2 Ограничение размера тела запроса

На уровне приложения (обязательно):

- формы: 100–300 KB
    
- json api: 1–2 MB максимум
    
- uploads: только через отдельный upload flow (signed URLs)
    

### 5.3 Webhooks: обязательная подпись

Любой webhook endpoint должен:

- проверять **подпись** (Stripe signature, HMAC secret и т.п.)
    
- отклонять запрос без подписи
    

Cloudflare-правило:

- Всё к `/api/webhooks/*` без валидных признаков (headers/UA) получает challenge/block, но **не ломаем легит**.
    

---

## 6) Cloudflare Access для админки (рекомендуется как стандарт)

Если админка не публичная для всех:  
Cloudflare → Zero Trust → Access

**Политика:**

- `/admin/*` закрыт Access-правилом
    
- доступ только:
    
    - твой email/команда (Google Workspace) **или**
        
    - VPN/IP allowlist **или**
        
    - One-time PIN (как минимум)
        

**Зачем:** это проще и надежнее, чем надеяться, что “никто не угадает /admin”.

---

## 7) Origin hardening (что делаем на Vercel и Render)

### 7.1 Vercel (Next.js)

- Origin в целом “managed”, но минимум:
    
    - не светить secret endpoints без auth
        
    - включить логирование 401/403/429
        
    - отдельные endpoints для webhook с подписью
        

### 7.2 Render (NestJS)

- Обязательно:
    
    - `helmet` (security headers)
        
    - `rate limit` в приложении (на всякий случай)
        
    - строгий CORS
        
    - trust proxy (если используешь real IP из CF headers)
        

**Важно про real IP:**

- Если нужно “настоящий IP клиента” в приложении:
    
    - используешь `CF-Connecting-IP` / `X-Forwarded-For`
        
    - в Nest/Express включить корректный `trust proxy`, но аккуратно (только если уверенно за CF).
        

---

## 8) Observability: как понять, что WAF работает, а не делает вид

**Обязательно настроить:**

- Cloudflare Security Events мониторинг
    
- Алерт/лог на всплеск:
    
    - 401/403 (подбор)
        
    - 429 (rate limit)
        
    - 5xx (просадка)
        

**Норма:** после включения WAF ты увидишь много “мусора”. Это не баг. Это реальность интернета.

---

## 9) Минимальный чек-лист внедрения (копируй в каждый проект)

### 9.1 Инфраструктура

-  Домен в Cloudflare
    
-  DNS для `@`, `www`, `api` proxied ON
    
-  SSL/TLS = Full (strict)
    
-  HSTS включен (после проверки)
    

### 9.2 WAF / Rulesets

-  Cloudflare Managed Ruleset включен
    
-  OWASP CRS включен
    
-  Стартовый action = Managed Challenge, потом тюнинг до Block
    

### 9.3 Rate limiting

-  Auth endpoints лимиты поставлены
    
-  Public forms лимиты поставлены
    
-  Search/expensive endpoints лимиты поставлены
    
-  Webhooks отдельная политика (подпись + исключения)
    

### 9.4 Bot protection

-  Bot защита включена
    
-  Whitelist для нужных ботов/мониторов
    

### 9.5 App-level

-  CORS строгий
    
-  request body size limits
    
-  webhooks signature verification
    
-  security headers (helmet/next headers)
    

### 9.6 Admin protection

-  `/admin/*` закрыт через Cloudflare Access или allowlist
    

---

## 10) Стандартные исключения (чтобы не сломать бизнес)

### Webhooks (Stripe и прочее)

- Не ставить агрессивный rate limit как для пользователей
    
- Разрешать по подписи, а не “по вере”
    

### Платёжные страницы/checkout

- Слишком строгий challenge может снижать конверсию
    
- Для `/checkout` и `POST /api/checkout/*`:
    
    - лучше умеренные лимиты
        
    - лучше “Managed Challenge” только при явной атаке
        

---

## 11) Режимы окружений

**Production**

- Все правила включены
    

**Staging**

- WAF включен, но больше в режиме “challenge”, чтобы тест не ломался
    
- Можно ослабить лимиты, но не выключать полностью (иначе сюрпризы на проде)
    

---

## 12) Минимальные “значения по умолчанию” (таблица для регламента)

- Auth login: 10/min/IP
    
- Register: 5/10min/IP
    
- Forgot/reset: 5/10min/IP
    
- OTP verify: 20/5min/IP
    
- Contact/lead forms: 10/10min/IP
    
- Search GET: 120/min/IP
    
- Heavy endpoints: 30/min/IP
    
- Admin: Access/Allowlist, иначе Block
    
- Webhooks: signature required + отдельная политика
    

---

Если будешь использовать этот документ как **внутренний регламент**, просто вставляй его как есть в `/docs/security/EDGE_WAF_STANDARD.md` и в каждом проекте добавляй приложение-список конкретных endpoint’ов, которые попадают в группы A–E. Это единственная часть, которую “надо подумать”, всё остальное уже сделано за тебя. Да, иногда так бывает.