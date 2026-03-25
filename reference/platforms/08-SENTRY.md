# Sentry — Полная настройка

> Sentry — платформа для error tracking, performance monitoring, session replay.

---

## 📋 СОДЕРЖАНИЕ

1. [Создание аккаунта](#создание-аккаунта)
2. [Создание проекта](#создание-проекта)
3. [Next.js интеграция](#nextjs)
4. [NestJS интеграция](#nestjs)
5. [Source Maps](#source-maps)
6. [Performance Monitoring](#performance)
7. [Alerts](#alerts)
8. [Release Tracking](#releases)
9. [Session Replay](#session-replay)
10. [Checklist](#checklist)

---

## 1. Создание аккаунта {#создание-аккаунта}

### Шаги:

1. Перейти на [sentry.io](https://sentry.io)
2. "Get Started" → GitHub / Google / Email
3. Создать Organization

### Pricing:

| План | Стоимость | Events/month |
|------|-----------|--------------|
| Developer | Free | 5,000 |
| Team | $26/month | 50,000 |
| Business | $80/month | 100,000+ |

### Free tier включает:

- 5,000 errors/month
- 10,000 performance units
- 50 session replays
- 1 user
- 30 days retention

---

## 2. Создание проекта {#создание-проекта}

### Шаги:

1. Settings → Projects → "Create Project"
2. Выбрать платформу:
   - **Next.js** для frontend
   - **Node.js** для backend
3. Получить DSN:
   ```
   https://xxx@xxx.ingest.sentry.io/xxx
   ```

### Настройки проекта:

1. Project Settings → General:
   - **Name:** my-app-frontend
   - **Platform:** javascript-nextjs
   
2. Client Keys (DSN):
   - Скопировать DSN

---

## 3. Next.js интеграция {#nextjs}

### Установка:

```bash
npx @sentry/wizard@latest -i nextjs
```

Wizard создаст:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Обновит `next.config.js`

### Или вручную:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance
  tracesSampleRate: 1.0, // 100% в dev, уменьшить в prod
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% сессий
  replaysOnErrorSampleRate: 1.0, // 100% при ошибках
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Ignore errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Network request failed',
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // your config
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-org',
  project: 'your-project',
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

### Environment Variables:

```bash
# Public (клиент)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Private (сервер, CI)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Error Boundary:

```tsx
// app/global-error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h1>Something went wrong!</h1>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

---

## 4. NestJS интеграция {#nestjs}

### Установка:

```bash
npm install @sentry/node @sentry/profiling-node
```

### Инициализация:

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... rest of setup
}
```

### Exception Filter:

```typescript
// src/common/filters/sentry.filter.ts
import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    
    // Capture in Sentry
    Sentry.withScope((scope) => {
      scope.setUser({
        id: request.user?.id,
        email: request.user?.email,
      });
      
      scope.setExtra('url', request.url);
      scope.setExtra('method', request.method);
      scope.setExtra('body', request.body);
      
      Sentry.captureException(exception);
    });
    
    super.catch(exception, host);
  }
}
```

```typescript
// main.ts
app.useGlobalFilters(new SentryFilter(httpAdapter));
```

### Request Tracing:

```typescript
// src/common/interceptors/sentry.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    return Sentry.startSpan(
      {
        op: 'http.server',
        name: `${request.method} ${request.route?.path || request.url}`,
      },
      () => {
        return next.handle().pipe(
          tap({
            error: (error) => {
              Sentry.captureException(error);
            },
          }),
        );
      },
    );
  }
}
```

---

## 5. Source Maps {#source-maps}

### Автоматическая загрузка (Next.js):

```javascript
// next.config.js
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-org',
  project: 'your-project',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Upload source maps
  widenClientFileUpload: true,
  hideSourceMaps: true,
});
```

### Через CLI:

```bash
# Установить CLI
npm install -g @sentry/cli

# Загрузить source maps
sentry-cli sourcemaps upload \
  --org your-org \
  --project your-project \
  --auth-token $SENTRY_AUTH_TOKEN \
  .next/
```

### В CI/CD:

```yaml
# .github/workflows/deploy.yml
- name: Upload Source Maps
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: |
    sentry-cli sourcemaps upload \
      --org your-org \
      --project your-project \
      .next/
```

---

## 6. Performance Monitoring {#performance}

### Web Vitals:

```typescript
// Автоматически отслеживаются с @sentry/nextjs:
// - LCP (Largest Contentful Paint)
// - FID (First Input Delay) / INP
// - CLS (Cumulative Layout Shift)
// - TTFB (Time to First Byte)
```

### Custom Transactions:

```typescript
import * as Sentry from '@sentry/nextjs';

async function processOrder(orderId: string) {
  return Sentry.startSpan(
    { name: 'processOrder', op: 'function' },
    async (span) => {
      // Nested span
      await Sentry.startSpan(
        { name: 'validateOrder', op: 'validation' },
        async () => {
          await validateOrder(orderId);
        }
      );
      
      // Another nested span
      await Sentry.startSpan(
        { name: 'chargePayment', op: 'payment' },
        async () => {
          await chargePayment(orderId);
        }
      );
      
      return { success: true };
    }
  );
}
```

### Database Spans:

```typescript
// Для Prisma - автоматически через integration
import { PrismaIntegration } from '@sentry/node';

Sentry.init({
  integrations: [
    new PrismaIntegration(),
  ],
});
```

---

## 7. Alerts {#alerts}

### Настройка через UI:

1. Alerts → "Create Alert"
2. Выбрать тип:
   - **Issue Alert** — при новых ошибках
   - **Metric Alert** — при превышении порогов

### Issue Alert (рекомендуемые):

```markdown
## Alert: New Error

When: A new issue is created
Conditions: 
  - Level is error or fatal
  - Event count > 1 in 1 hour
Actions:
  - Send notification to Slack
  - Send email
```

### Metric Alert:

```markdown
## Alert: High Error Rate

When: Error count > 100 in 5 minutes
Actions:
  - Send critical notification
  - Create PagerDuty incident
```

### Slack Integration:

1. Settings → Integrations → Slack
2. "Add to Slack"
3. Выбрать канал для alerts

---

## 8. Release Tracking {#releases}

### Автоматически при деплое:

```yaml
# .github/workflows/deploy.yml
- name: Create Sentry Release
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: |
    VERSION=$(git rev-parse --short HEAD)
    
    sentry-cli releases new $VERSION
    sentry-cli releases set-commits $VERSION --auto
    sentry-cli releases finalize $VERSION
```

### В коде:

```typescript
Sentry.init({
  dsn: '...',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
});
```

### Deploy tracking:

```bash
sentry-cli releases deploys $VERSION new -e production
```

---

## 9. Session Replay {#session-replay}

### Настройка:

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: '...',
  
  integrations: [
    Sentry.replayIntegration({
      // Mask all text (privacy)
      maskAllText: true,
      // Block all media
      blockAllMedia: true,
    }),
  ],
  
  // Record 10% of all sessions
  replaysSessionSampleRate: 0.1,
  
  // Record 100% of sessions with errors
  replaysOnErrorSampleRate: 1.0,
});
```

### Privacy настройки:

```typescript
Sentry.replayIntegration({
  maskAllText: true,           // Скрывать весь текст
  maskAllInputs: true,         // Скрывать все inputs
  blockAllMedia: true,         // Блокировать медиа
  
  // Или выборочно
  block: ['.sensitive-data'],  // CSS селекторы
  mask: ['input[type=password]'],
});
```

---

## ✅ Checklist {#checklist}

### Первоначальная настройка:

- [ ] Аккаунт создан
- [ ] Organization создана
- [ ] Project создан (frontend и/или backend)
- [ ] DSN получен

### Next.js:

- [ ] @sentry/nextjs установлен
- [ ] sentry.*.config.ts созданы
- [ ] next.config.js обновлён
- [ ] NEXT_PUBLIC_SENTRY_DSN в env
- [ ] global-error.tsx создан

### NestJS:

- [ ] @sentry/node установлен
- [ ] Sentry.init() в main.ts
- [ ] SentryFilter настроен
- [ ] SENTRY_DSN в env

### Source Maps:

- [ ] SENTRY_AUTH_TOKEN получен
- [ ] Source maps загружаются при деплое
- [ ] hideSourceMaps: true (не показывать в браузере)

### Performance:

- [ ] tracesSampleRate настроен
- [ ] Web Vitals отслеживаются
- [ ] Database spans (если Prisma)

### Alerts:

- [ ] Issue alerts настроены
- [ ] Slack/Email notifications
- [ ] Критичные алерты настроены

### Releases:

- [ ] Release tracking настроен
- [ ] Commits привязаны к releases
- [ ] Deploy tracking

### Session Replay (опционально):

- [ ] Replay включён
- [ ] Privacy настройки (mask/block)
- [ ] Sample rates настроены

---

**Версия:** 1.0
