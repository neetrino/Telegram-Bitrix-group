# 8. Dependency scanning

> [!info] Условные обозначения
> **🤖 В коде** — задаёшь AI: добавить шаг в CI.  
> **👤 Вручную** — включить Dependabot/Renovate в репозитории. Делаешь ты.

---

## 🤖👤 8.1 Dependency scanning in CI (npm audit / Dependabot/Renovate)

**Вариант А — в коде / CI (🤖):**
- В GitHub Actions (или другой CI) добавить шаг: `npm audit --audit-level=high` (или `pnpm audit`, `yarn audit`). При наличии уязвимостей уровня high/critical пайплайн должен падать.
- Опционально: шаг с Snyk или другим сканером по API, если настроен.

**Проверка:** Локально или в CI при наличии уязвимости high — сборка/чек падает.

---

**Вариант Б — вручную в репозитории (👤):**
- **GitHub:** **Repository → Settings → Code security and analysis.** Включить **Dependabot alerts** и при желании **Dependabot security updates**. Тогда GitHub будет создавать PR с обновлениями уязвимых зависимостей.
- **Renovate (альтернатива):** Установить приложение Renovate для репо и настроить (по умолчанию создаёт PR для обновлений). В конфиге можно включить только security fixes.

**Проверка:** В разделе Security репозитория видны алерты по зависимостям; при появлении уязвимости приходит PR или уведомление.

---

**Рекомендация:** использовать оба подхода: 🤖 CI с `npm audit` для жёсткого гейта и 👤 Dependabot/Renovate для автоматических PR с фиксами.
