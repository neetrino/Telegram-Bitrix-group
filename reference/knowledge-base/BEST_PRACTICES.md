# Best Practices

> Այս ֆայլը — համառոտ օգնական։ Ամբողջական կանոնները — `.cursor/rules/`-ում։

---

## Կանոնների աղբյուրներ

| Թեմա | Ֆայլ |
|------|------|
| Հիմնական կանոններ | `.cursor/rules/00-core.mdc` |
| Կոդի ստանդարտներ | `.cursor/rules/02-coding-standards.mdc` |
| Ճարտարապետություն | `.cursor/rules/01-architecture.mdc` |
| TypeScript | `.cursor/rules/03-typescript.mdc` |
| Անվտանգություն | `.cursor/rules/08-security.mdc` |
| Սխալների մշակում | `.cursor/rules/12-error-handling.mdc` |

## Արագ կանոններ

- **Ֆունկցիաներ.** ≤ 50 տող, ≤ 4 պարամետր
- **Ֆայլեր.** ≤ 300 տող
- **Բնիկություն.** ≤ 3 մակարդակ
- **TypeScript.** strict mode, առանց `any`
- **Export-ներ.** անվանված, առանց default
- **Ոճ.** Tailwind, առանց inline styles
- **Գաղտնիքներ.** միայն env-ով
- **Գաղտնաբառեր.** argon2
- **ORM.** Prisma (առանց raw SQL)

---

**Վերջին թարմացում.** 2026-02-12
