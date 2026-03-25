# Naming Conventions

> Այս ֆայլը — համառոտ օգնական։ Ամբողջական կանոնները — `.cursor/rules/02-coding-standards.mdc`-ում։

---

## Ֆայլեր

| Տիպ | Ձևաչափ | Օրինակ |
|-----|--------|--------|
| React կոմպոնենտներ | PascalCase | `ProductCard.tsx` |
| Հուկեր | camelCase + use | `useProducts.ts` |
| Ուտիլիտաներ | camelCase | `formatPrice.ts` |
| Տիպեր | camelCase.types | `product.types.ts` |
| Թեստեր | *.test.ts(x) | `formatPrice.test.ts` |
| NestJS սերվիսներ | kebab-case | `products.service.ts` |

## Կոդ

| Տիպ | Ձևաչափ | Օրինակ |
|-----|--------|--------|
| Փոփոխականներ | camelCase | `userName` |
| Ֆունկցիաներ | camelCase | `getProducts` |
| Դասեր/Ինտերֆեյսներ | PascalCase | `ProductService` |
| Հաստատուններ | UPPER_SNAKE | `API_BASE_URL` |
| Enum արժեքներ | UPPER_SNAKE | `OrderStatus.PENDING` |
| Boolean | is/has/can | `isActive`, `hasAccess` |

## ԲԴ (Prisma)

- Մոդելներ. PascalCase (`OrderItem`)
- Դաշտեր. camelCase (`createdAt`)
- Աղյուսակներ. snake_case `@@map("order_items")`-ով

---

> Ամբողջական կանոններ, օրինակներ և հակապաթեռններ. `.cursor/rules/02-coding-standards.mdc`

**Վերջին թարմացում.** 2026-02-12
