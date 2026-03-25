# Ստանդարտ տեխնոլոգիական stack

> Խորհուրդ տրվող տեխնոլոգիաներ տարբեր տիպի նախագծերի համար։

---

## 📦 PACKAGE MANAGER

| Գործիք | Ստատուս | Նշում |
|--------|---------|-------|
| **pnpm** | Խորհուրդ տրվող | Ավելի արագ, strict node_modules, խնայում է սկավառակ |

> pnpm — ստանդարտ բոլոր նախագծերի համար (A/B/C)। Օգտագործի՛ր `pnpm` `npm`-ի փոխարեն բոլոր հրամաններում։

---

## 🌐 WEB-ԾՐԱԳՐԵՐ (Next.js)

### Փոքր և միջին նախագծերի համար (A/B)

| Կատեգորիա | Տեխնոլոգիա | Տարբերակ | Նշանակություն |
|------------|-------------|-----------|----------------|
| **Framework** | Next.js | 16.x | Full-stack React (React 19, Turbopack) |
| **Language** | TypeScript | 5.9 | Տիպացում |
| **Styling** | Tailwind CSS | 4.x | Utility-first ոճեր |
| **UI Components** | shadcn/ui | - | Կոմպոնենտներ |
| **State** | Zustand | 5.x | Գլոբալ state |
| **Forms** | React Hook Form | 7.x | Ձևեր |
| **Validation** | Zod | 3.x | Սխեմաների վալիդացիա |
| **ORM** | Prisma | 7.x | Աշխատանք ԲԴ-ի հետ |
| **Database** | PostgreSQL | 17.x | Հիմնական ԲԴ |
| **Auth** | Auth.js (NextAuth v5) | 5.x | Ինքնություն հաստատում |
| **Icons** | Lucide React | - | Իկոններ |
| **Storage** | Cloudflare R2 | - | Ֆայլերի պահոց (S3-compatible) |

### Մեծ նախագծերի համար (C) — ավելացնել

| Կատեգորիա | Տեխնոլոգիա | Տարբերակ | Նշանակություն |
|------------|-------------|-----------|----------------|
| **Monorepo** | Turborepo | 2.x | Monorepo կառավարում |
| **Package Manager** | pnpm | 9.x | Արագ մենեջեր |
| **Backend** | NestJS | 11.x | Enterprise backend |
| **Cache** | Redis | 7.x | Cache |
| **Queue** | BullMQ | 5.x | Առաջադրանքների հերթեր |
| **Search** | Meilisearch | 1.x | Ամբողջատեքստային որոնում |
| **Logging** | Pino | 9.x | Կառուցվածքային լոգեր |
| **Monitoring** | Sentry | - | Սխալների մոնիտորինգ |

---

## 🔧 BACKEND (NestJS)

### Հիմնական stack

| Կատեգորիա | Տեխնոլոգիա | Տարբերակ | Նշանակություն |
|------------|-------------|-----------|----------------|
| **Framework** | NestJS | 11.x | Backend framework |
| **Language** | TypeScript | 5.9 | Տիպացում |
| **ORM** | Prisma | 7.x | Աշխատանք ԲԴ-ի հետ |
| **Validation** | class-validator | 0.14.x | DTO վալիդացիա |
| **Transform** | class-transformer | 0.5.x | Տրանսֆորմացիա |
| **Auth** | Passport | 0.7.x | Ինքնություն հաստատում |
| **JWT** | @nestjs/jwt | 10.x | JWT tokens |
| **Swagger** | @nestjs/swagger | 7.x | API փաստաթղթավորում |
| **Config** | @nestjs/config | 3.x | Կոնֆիգուրացիա |
| **Cache** | @nestjs/cache-manager | 2.x | Cache |

### Լրացուցիչ

| Կատեգորիա | Տեխնոլոգիա | Նշանակություն |
|------------|-------------|----------------|
| **Queue** | BullMQ | Խորքային առաջադրանքներ |
| **Events** | EventEmitter2 | Իրադարձություններ |
| **Emails** | Nodemailer | Email առաքում |
| **Files** | Multer | Ֆայլերի բեռնում |
| **Health** | @nestjs/terminus | Healthchecks |

---

## 🗄️ ԲԱԶԱՅԻՆ ՏՎՅԱԼՆԵՐ

### Հիմնական

| ԲԴ | Երբ օգտագործել |
|----|-----------------|
| **PostgreSQL 17+** | 95% նախագծեր (լռելյայն) |
| **MongoDB** | Փաստաթղթեր, նախատիպեր, ճկուն սխեմա |
| **SQLite** | Նախատիպեր, ներկառուցված համակարգեր |

### Օժանդակ

| ԲԴ | Նշանակություն |
|----|----------------|
| **Redis** | Cache, սեսիաներ, հերթեր |
| **Elasticsearch** | Ամբողջատեքստային որոնում |
| **Meilisearch** | Որոնում (ավելի պարզ քան ES) |

---

## 🧪 ԹԵՍՏԱՎՈՐՈՒՄ

| Կատեգորիա | Տեխնոլոգիա | Նշանակություն |
|------------|-------------|----------------|
| **Unit/Integration** | Vitest | Արագ թեստեր |
| **E2E** | Playwright | Բրաուզերային թեստեր |
| **Mocking** | MSW | Mock API |
| **Coverage** | c8 / istanbul | Ծածկույթ |

---

## 🛠️ ԶԱՐԳԱՑՄԱՆ ԳՈՐԾԻՔՆԵՐ

| Կատեգորիա | Տեխնոլոգիա | Նշանակություն |
|------------|-------------|----------------|
| **Linting** | ESLint | Կոդի որակ |
| **Formatting** | Prettier | Ֆորմատավորում |
| **Git Hooks** | Husky | Pre-commit ստուգումներ |
| **Commit Lint** | commitlint | Commit-ների ոճ |
| **Editor** | Cursor/VSCode | IDE |

---

## 🚀 ԴԵՊԼՈՅ ԵՎ ԻՆՖՐԱԿԱՌՈՒՑՎԱԾՔ

### Հոսթինգ

| Պլատֆորմ | Ինչի համար | Նախագծեր |
|-----------|-------------|-----------|
| **Vercel** | Frontend (Next.js) | A, B |
| **Railway** | Backend + DB | A, B |
| **VPS** | Ամբողջական վերահսկում | B, C |
| **Kubernetes** | Enterprise | C |

### CI/CD

| Պլատֆորմ | Նշանակություն |
|-----------|----------------|
| **GitHub Actions** | CI/CD pipeline |
| **Docker** | Կոնտեյներացում |

---

## 📦 ԽՈՐՀՈՒՐԴՆԵՐ ՏԱՐԲԵՐԱԿՆԵՐԻ ՎԵՐԱԲԵՐՅԱԼ

### Թարմացումներ

- **Patch տարբերակներ** (x.x.1 → x.x.2). թարմացրու՛ անմիջապես
- **Minor տարբերակներ** (x.1.x → x.2.x). թարմացրու՛ մեկ շաբաթի ընթացքում
- **Major տարբերակներ** (1.x.x → 2.x.x). պլանավորի՛ր միգրացիա, թեստավորի՛ր

### Տարբերակների ամրագրում

```json
// package.json — օգտագործի՛ր ճշգրիտ տարբերակներ
{
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0"
  }
}
```

---

## 🔗 Օգտակար հղումներ

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [shadcn/ui](https://ui.shadcn.com)

---

**Վերջին թարմացում.** 2026-02-12
