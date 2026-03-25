# Auth — Ամբողջական կարգավորում

> Աուտենտիֆիկացիա. Auth.js (հիմնական) Next.js-ի, Passport.js + JWT NestJS-ի համար։
> Clerk — այլընտրանք SaaS-նախագծերի համար, որտեղ պատրաստի UI է պետք։

---

## 📋 ԲՈՎԱՆԴԱԿՈՒԹՅՈՒՆ

### Auth.js (հիմնական — անվճար, open-source)
1. [Auth.js-ի կարգավորում](#authjs-setup)
2. [Providers](#authjs-providers)
3. [Database Adapter](#authjs-database)
4. [Routes-ի պաշտպանություն](#authjs-protection)

### NestJS Backend (Passport.js + JWT)
5. [Ստեքների կապ. Auth.js → NestJS](#cross-stack)

### Clerk (այլընտրանք SaaS-ի համար)
6. [Երբ օգտագործել Clerk](#clerk-when)
7. [Clerk-ի կարգավորում](#clerk-setup)

8. [Checklist](#checklist)

---

## Auth-լուծման ընտրություն

| Չափանիշ | Auth.js | Clerk |
|----------|---------|-------|
| Ծախս | Անվճար | $0 → $25+/ամիս |
| Open-source | Այո | Ոչ (SaaS) |
| Next.js ինտեգրացիա | Native (App Router) | SDK |
| Պատրաստի UI | Ոչ (սեփական) | Այո (կոմպոնենտներ) |
| NestJS backend | JWT → Passport.js | Webhook sync |
| Երրորդ կողմից կախվածություն | Ոչ | Այո |
| Կաստոմիզացիա | Լիակատար | Սահմանափակ |

**Խորհուրդ.**
- **Auth.js** — նախագծերի մեծամասնության համար (անվճար, ամբողջական վերահսկում, native Next.js)
- **Clerk** — երբ auth-ի պատրաստի UI և օգտատերերի կառավարում out-of-the-box է պետք (SaaS)

---

# AUTH.JS (ՀԻՄՆԱԿԱՆ)

## 1. Auth.js-ի կարգավորում {#authjs-setup}

### Տեղադրում.

```bash
pnpm add next-auth@beta @auth/prisma-adapter
```

### Կոնֆիգուրացիա.

```typescript
// auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/prisma';
import { verify } from 'argon2';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await verify(user.password, credentials.password as string);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

### Environment Variables:

```bash
AUTH_SECRET="your-secret-here"          # openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Providers (ավելացրու՛ անհրաժեշտները)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Route Handlers:

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

### Middleware:

```typescript
// middleware.ts
import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 2. Providers {#authjs-providers}

### GitHub:

1. GitHub → Settings → Developer settings → OAuth Apps
2. New OAuth App:
   - Homepage URL: `https://your-app.com`
   - Callback URL: `https://your-app.com/api/auth/callback/github`

### Google:

1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-app.com/api/auth/callback/google`

---

## 3. Database Adapter {#authjs-database}

### Prisma Schema:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Credentials provider-ի համար
  role          Role      @default(USER)
  accounts      Account[]
  sessions      Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum Role {
  USER
  ADMIN
}
```

---

## 4. Routes-ի պաշտպանություն {#authjs-protection}

### Server Component:

```tsx
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <h1>Բարև, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### API Route:

```typescript
// app/api/user/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return NextResponse.json(user);
}
```

---

## 5. Ստեքների կապ. Auth.js → NestJS {#cross-stack}

Երբ Next.js (frontend) + NestJS (backend) — օգտագործի՛ր JWT կապի համար.

### Auth.js — թողարկում է JWT.

```typescript
// auth.ts — ավելացնել callbacks-ում
callbacks: {
  jwt: async ({ token, user }) => {
    if (user) {
      token.id = user.id;
      token.role = user.role;
    }
    return token;
  },
  session: ({ session, token }) => ({
    ...session,
    user: {
      ...session.user,
      id: token.id as string,
      role: token.role as string,
    },
  }),
},
session: { strategy: 'jwt' },
```

### NestJS — վալիդացնում է նույն JWT-ը.

```typescript
// auth/jwt.strategy.ts (NestJS)
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.AUTH_SECRET, // Նույն secret-ը, ինչ Auth.js-ում
    });
  }

  validate(payload: { id: string; role: string }) {
    return { id: payload.id, role: payload.role };
  }
}
```

> AUTH_SECRET-ը **նույնը** պետք է լինի Next.js-ում և NestJS-ում JWT-ի վալիդացիայի համար։

---

# CLERK (ԱՅԼԸՆՏՐԱՆՔ)

## 6. Երբ օգտագործել Clerk {#clerk-when}

Clerk-ը հարմար է, երբ.
- Պետք է **պատրաստի UI** auth-ի համար (ձևեր, կոմպոնենտներ, user management)
- Նախագիծը **SaaS** է կազմակերպությունների կառավարումով
- Ժամանակ չկա custom auth UI-ի համար
- Բյուջեն թույլ է տալիս ($25+/ամիս Pro-ում)

### Pricing.

| Պլան | Ծախս | MAU |
|------|-----------|-----|
| Free | $0 | 10,000 |
| Pro | $25/month | 10,000 + $0.02/MAU |
| Enterprise | Custom | Unlimited |

---

## 7. Clerk-ի կարգավորում {#clerk-setup}

### Տեղադրում.

```bash
pnpm add @clerk/nextjs
```

### Environment Variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### Middleware:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Provider:

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

> Clerk-ի ամբողջական փաստաթղթեր. [clerk.com/docs](https://clerk.com/docs)

---

## ✅ Ստուգացուցակ {#checklist}

### Auth.js (հիմնական).

- [ ] `next-auth@beta` տեղադրված է (`pnpm add next-auth@beta`)
- [ ] `auth.ts` կարգավորված է
- [ ] Providers կարգավորված են (GitHub, Google և այլն)
- [ ] `@auth/prisma-adapter` կարգավորված է
- [ ] Middleware կարգավորված է
- [ ] `AUTH_SECRET` ավելացված է `.env`-ում
- [ ] Prisma schema-ում կան User, Account, Session, VerificationToken
- [ ] Protected routes աշխատում են

### NestJS backend (եթե կա).

- [ ] Passport.js + JWT strategy կարգավորված են
- [ ] `AUTH_SECRET` նույնն է Next.js-ում և NestJS-ում
- [ ] JWT Guards աշխատում են

### Clerk (եթե ընտրված է).

- [ ] `@clerk/nextjs` տեղադրված է
- [ ] Բանալիներ ավելացված են `.env`-ում
- [ ] `ClerkProvider` layout-ում
- [ ] Middleware կարգավորված է
- [ ] Webhooks կարգավորված են (ԲԴ-ի հետ սինխրոնացում)

### Ընդհանուր.

- [ ] Protected routes աշխատում են
- [ ] User data սինխրոնացվում է ԲԴ-ի հետ
- [ ] Sign out աշխատում է
- [ ] Error handling կարգավորված է

---

**Տարբերակ.** 2.0
**Ամսաթիվ.** 2026-02-12
