# Clerk — միացում նախագծին և Neon-ին

Մեկ փաստաթուղթ. ինչ անել, որպեսզի Clerk-ը աշխատի կայքում և օգտատերերը հայտնվեն Neon-ում (ներառյալ admin դեր)։

---

## 1. Clerk-ը նախագծում

- **Clerk** — մուտք/գրանցում (email, password, OAuth). Օգտատերը ստեղծվում է Clerk-ում.
- **Neon** — մեր PostgreSQL (Prisma). Աղյուսակ **User** (clerkId, email, phone, role). Պետք է, որպեսզի կարողանանք նշանակել դեր (USER / ADMIN) և կապել պատվերներ, հասցեներ.
- **Կապ** — Clerk-ի յուրաքանչյուր օգտատիրոջ համար Neon-ում պետք է լինի User (clerkId-ով). Դա արվում է ավտոմատ (տես բաժին 4–5).

---

## 2. Clerk Application և բանալիներ

1. Գնալ [Clerk Dashboard](https://dashboard.clerk.com) → **Create application** (կամ ընտրել առկա).
2. **API Keys** → պատճենել.
   - **Publishable key** (`pk_...`) → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** (`sk_...`) → `CLERK_SECRET_KEY`
3. Այդ արժեքները ավելացնել `.env`-ում (ոչ git-ում).

---

## 3. Environment variables (Clerk)

Ձեր `.env`-ում պետք է լինեն.

```env
# ——— Auth (Clerk) ———
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Ձեր էջերում sign-in/sign-up (ոչ accounts.dev)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Webhook: Clerk → Neon (բաժին 5)
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
```

**Կարևոր.** `NEXT_PUBLIC_CLERK_SIGN_IN_URL` և `NEXT_PUBLIC_CLERK_SIGN_UP_URL`-ը **պարտադիր** են, այլապես Clerk-ը կուղարկի օգտատիրոջը `accounts.dev`-ում, ոչ ձեր կայքում։

---

## 4. Clerk Dashboard — Paths (sign-in/sign-up ձեր կայքում)

1. Clerk Dashboard → ձեր Application → **Configure** → **Developers** → **Paths** (Component paths).
2. **Sign-in**: ընտրել «Sign-in page on **development host**», դաշտում գրել `/sign-in`.
3. **Sign-up**: ընտրել «Sign-up page on **development host**», դաշտում գրել `/sign-up`.
4. **Signing out**: ընտրել «Page on development host», գրել `/` կամ `/sign-in`.

Մի գրել ամբողջ URL (`http://localhost:3000/...`) — միայն **path** (օր. `/sign-in`). Պահել (Save).

---

## 5. Ինչ արդեն կա նախագծում (էջեր)

| Path | Նկարագրություն |
|------|------------------|
| `/[locale]/sign-in` | Clerk `<SignIn />` — մուտք |
| `/[locale]/sign-up` | Clerk `<SignUp />` — գրանցում |
| `/[locale]/account` | Հաշիվ. Dashboard, պատվերներ, հասցեներ, Account (Clerk profile) |
| `/[locale]/account/onboarding` | Գրանցումից հետո. հեռախոս + առաքման հասցե (User + Address Neon-ում) |
| `/[locale]/account/manage` | Clerk UserProfile (email, password, security) |

Header-ում account ikonkan տանում է `/account`; «Դուրս գալ» — account սայդբարի ներքևում։

---

## 6. Clerk → Neon. Օգտատերը երբ հայտնվում է Neon-ում

Օգտատերը **Clerk**-ում ստեղծվում է գրանցման պահին։ **Neon**-ի `User` աղյուսակում նա հայտնվում է երկու ձևով.

### 6.1. Account էջի առաջին մուտք

Յուրաքանչյուր `/account` (և ենթաէջ) բացելիս layout-ը կանչում է `getOrCreateUserByClerkId(clerkId, { email })`.  
Եթե այդ clerkId-ով User դեռ չկա — ստեղծվում է (clerkId, email, role=USER). Այսինքն **առաջին այցելությունից** օգտատերը արդեն Neon-ում է։

### 6.2. Webhook (գրանցումից անմիջապես հետո)

Եթե կարգավորեք webhook (ստորև), Clerk-ը գրանցումից հետո կուղարկի `user.created` իրադարձությունը մեր API-ին, և մենք Neon-ում կստեղծենք User. Այդ դեպքում օգտատերը Neon-ում կլինի նույնիսկ առանց account էջ բացելու։

---

## 7. Webhook — կարգավորում

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL**:
   - Production: `https://yourdomain.com/api/webhooks/clerk`
   - Development: ngrok/tunnel, օր. `https://xxxx.ngrok.io/api/webhooks/clerk`
3. **Subscribe to events**: նշել **user.created** (և ցանկության դեպքում **user.updated**).
4. **Signing secret** — պատճենել (`whsec_...`) և ավելացնել `.env`:
   ```env
   CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
   ```
5. Պահել։ Clerk-ը կսկսի POST ուղարկել `/api/webhooks/clerk`; նախագծում route-ը ստեղծում/թարմացնում է User Neon-ում (clerkId, email, role=USER).

---

## 8. Admin դեր նշանակել

Admin-ը ստուգվում է **Neon**-ի `User` աղյուսակի `role` դաշտով (`USER` | `ADMIN`). Օգտատերը նախ պետք է ունենա User գրառում (account մուտք կամ webhook):

1. Clerk Dashboard → **Users** → ընտրել օգտատիրոջը → պատճենել **User ID** (օր. `user_2abc...`).
2. Բացել **Prisma Studio** (`pnpm db:studio`) կամ Neon-ի SQL Editor.
3. **User** աղյուսակում գտնել այն տողը, որտեղ `clerkId` = պատճենած User ID.
4. `role` դաշտը փոխել `USER` → `ADMIN`.

**SQL-ով.**

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE "clerkId" = 'user_xxxxxxxx';
```

Դրանից հետո այդ օգտատերը կարող է մուտք գործել `/[locale]/admin` (getAdminUser-ը Neon-ից կվերադարձնի role=ADMIN):

---

## 9. Ստուգացուցակ

- [ ] Clerk Application ստեղծված, Publishable + Secret key ավելացված `.env`-ում
- [ ] `.env`-ում կան `NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"` և `NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"`
- [ ] Clerk Dashboard → Paths: sign-in/sign-up on development host, path-երը `/sign-in`, `/sign-up`
- [ ] (Ընտրովի) Webhook endpoint ավելացված, `CLERK_WEBHOOK_SIGNING_SECRET` ավելացված `.env`-ում
- [ ] Գրանցում → մուտք account → Neon-ում User հայտնվում է (Prisma Studio / `User` աղյուսակ)
- [ ] Admin: Neon-ում `User.role = 'ADMIN'` ըստ `clerkId` → մուտք `/admin`

---

## 10. Հղումներ

- [Clerk: Customize redirect URLs](https://clerk.com/docs/guides/custom-redirects)
- [Clerk environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [Clerk Webhooks — Sync data](https://clerk.com/docs/webhooks/sync-data)
