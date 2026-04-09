# Оценка проекта AI Ask Wanda Frontend

**Дата:** 18 марта 2026 _(предыдущая: 13 марта 2026)_

## Общие данные

| Метрика       | 13.03.2026                         | 18.03.2026                         | Δ       |
| ------------- | ---------------------------------- | ---------------------------------- | ------- |
| Стек          | Next.js 16 + React 19 + TypeScript | Next.js 16 + React 19 + TypeScript | —       |
| Архитектура   | Feature Sliced Design (FSD)        | Feature Sliced Design (FSD)        | —       |
| Файлов TS/TSX | ~514                               | **530**                            | +16     |
| Строк кода    | ~35,000                            | **~40,200**                        | +5,200  |
| Features      | 19 модулей                         | 19 модулей                         | —       |
| Unit-тесты    | 161 suite / 1,022 tests ✅         | **169 suite / 1,158 tests** ✅     | +8/+136 |
| E2E тесты     | 3 spec-файла                       | **15 spec-файлов**                 | +12     |
| TS-ошибки     | 41 (в тестах)                      | **38 (в тестах)**                  | −3      |

---

## 🟢 Сильные стороны

### 1. Архитектура — отлично

- **FSD** реализован грамотно: 19 feature-модулей с чёткой изоляцией (ui/, api/,
  model/, types.ts, index.ts)
- Все 19 features имеют `index.ts` — публичный API соблюдён
- `shared/` хорошо структурирован: ui-кит (16 компонентов), lib (утилиты),
  hooks, types, store
- `entities/` выделены правильно (event, organization, participant, team, user)

### 2. Тестирование — значительно улучшилось

- **1,158 unit-тестов — все зелёные** ✅ (было 1,022; +136 за неделю)
- **+8 новых test suites** покрывают Server Actions и API-модули: auth, chat
  (chats/messages/artifacts), teams, methodology, user-profile, organization
- **E2E: 15 spec-файлов** (было 3) — покрыты auth, chat, teams, calendar,
  meeting, profile, dashboard, methodology, follow-ups, summary, landing,
  organization
- Jest + Testing Library — правильный выбор

### 3. Качество кода

- **Ноль `any`** в продакшн-коде — строгая типизация соблюдена
- **0 TODO/FIXME/HACK** — чистая кодовая база
- ESLint конфиг серьёзный: security, sonarjs, unicorn, jsdoc, import order,
  cognitive complexity
- Husky + lint-staged — защита от грязных коммитов

### 4. Инфраструктура Next.js

- **20 loading.tsx** — все маршруты имеют скелетоны загрузки
- **3 error boundaries** (app, dashboard, global) — ошибки обработаны
- React Compiler включён
- Security headers настроены (HSTS, X-Frame-Options, CSP)
- SSR-first подход: 76 client-компонентов, 20 server-actions — разумный баланс

### 5. Pre-push pipeline

- `scripts/pre-push-checks.sh` — автоматический eslint+prettier фикс перед
  пушем, TypeScript check, Jest CI, Telegram уведомления
- Статистика пуша: количество коммитов, файлов, строк +/−, время выполнения

### 6. Backend contract

- TypeScript типы приведены в соответствие с Laravel Resources/DTOs в 9 доменах:
  auth, user, team, methodology, organization, participant, follow-up, summary и
  др.
- Исправлена критическая ошибка: `organization_id` передавался строкой вместо
  integer

### 7. Агентная система

- 8 специализированных Claude-агентов: `fsd-boundary-guard`,
  `backend-contract-validator`, `unit-test-booster`, `performance-auditor`,
  `changelog-writer`, `e2e-coverage-agent`, `mr-reviewer`, `design-guardian`
- Покрывают: FSD аудит, контракты, тесты, перформанс, код-ревью, E2E

---

## 🟡 Замечания (средний приоритет)

### 1. TypeScript ошибки — 38 ошибок (в тестах)

Снизились с 41 до 38, но по-прежнему только в **тестовых файлах**. Тесты
запускаются через Jest (без type-check), поэтому сами по себе проходят. Но
`tsc --noEmit` падает.

Оставшиеся: `button-copy.test.tsx` (неверные аргументы),
`InputTextarea.test.tsx` (отсутствует обязательный prop `value`).

### 2. Дублирование зависимостей motion

В `package.json` стоят **и `framer-motion` (3 МБ), и `motion` (484 КБ)** — это
одно и то же (motion — ребрендинг framer-motion). В коде используется только
`framer-motion`. Пакет `motion` лишний.

### 3. `eslint-plugin-jsdoc` в dependencies

Стоит в `dependencies` вместо `devDependencies` — попадает в продакшн-бандл.

### 4. `react-hooks/exhaustive-deps: 'off'`

Отключённое правило exhaustive-deps — источник потенциальных багов с
useEffect/useMemo/useCallback. Стоит включить хотя бы `warn`.

### 5. Мобильная адаптация — частично

Landing-страница адаптирована (шапка, отступы для ≤768px и ≤400px). Остальные
страницы дашборда (teams, methodology, chat) не проверялись на мобильных
breakpoints.

---

## 🔴 Проблемы (высокий приоритет)

### 1. Lint сломан (не изменилось)

```
next lint → "Invalid project directory provided, no such directory: .../lint"
```

ESLint не запускается через `npm run lint`. Pre-push hook использует
`npx eslint` напрямую — это обходит проблему, но `npm run lint` по-прежнему не
работает.

### ~~2. `NODE_TLS_REJECT_UNAUTHORIZED = '0'`~~ — ✅ исправлено 18.03.2026

Строка удалена из `next.config.ts` — бэкенд `dev-api.shrugged.ai` получил
валидный TLS-сертификат.

### 3. Path alias — расхождение документации (исправлено в CLAUDE.md)

Реально `@/*` → `./*` (корень), не `src/`. CLAUDE.md уже исправлен, расхождения
нет.

---

## Структура features

| Feature      | api | ui  | model | hooks | tests  | index |
| ------------ | --- | --- | ----- | ----- | ------ | ----- |
| analysis     | ✗   | ✓   | ✓     | ✗     | 14     | ✓     |
| auth         | ✓   | ✓   | ✓     | ✗     | **18** | ✓     |
| calendar     | ✓   | ✓   | ✗     | ✗     | 11     | ✓     |
| chat         | ✓   | ✓   | ✓     | ✓     | **21** | ✓     |
| dashboard    | ✓   | ✓   | ✗     | ✗     | 2      | ✓     |
| demo         | ✓   | ✓   | ✗     | ✗     | 1      | ✓     |
| event        | ✓   | ✓   | ✓     | ✗     | 4      | ✓     |
| follow-up    | ✓   | ✓   | ✓     | ✗     | **5**  | ✓     |
| landing      | ✗   | ✓   | ✓     | ✗     | 4      | ✓     |
| meeting      | ✗   | ✓   | ✗     | ✗     | 2      | ✓     |
| menu         | ✗   | ✓   | ✓     | ✗     | 3      | ✓     |
| methodology  | ✓   | ✓   | ✓     | ✗     | **14** | ✓     |
| organization | ✓   | ✓   | ✓     | ✗     | **10** | ✓     |
| participants | ✓   | ✓   | ✓     | ✗     | 5      | ✓     |
| summary      | ✓   | ✓   | ✗     | ✗     | 6      | ✓     |
| teams        | ✓   | ✓   | ✓     | ✗     | **14** | ✓     |
| transcript   | ✓   | ✓   | ✓     | ✗     | 5      | ✓     |
| user-profile | ✓   | ✓   | ✗     | ✗     | **4**  | ✓     |
| user         | ✓   | ✓   | ✓     | ✗     | 5      | ✓     |

_Жирным — изменились с предыдущей оценки._

---

## Итоговая оценка

| Категория    | 13.03.2026                         | 18.03.2026                                |
| ------------ | ---------------------------------- | ----------------------------------------- |
| Архитектура  | ⭐⭐⭐⭐⭐                         | ⭐⭐⭐⭐⭐                                |
| Типизация    | ⭐⭐⭐⭐½ (тесты отстают)          | ⭐⭐⭐⭐½ (38 ошибок осталось в тестах)   |
| Тестирование | ⭐⭐⭐⭐ (unit отлично, E2E слабо) | ⭐⭐⭐⭐½ (unit +136, E2E ×5)             |
| Code Quality | ⭐⭐⭐⭐                           | ⭐⭐⭐⭐                                  |
| DevOps/CI    | ⭐⭐⭐ (lint сломан)               | ⭐⭐⭐½ (pre-push pipeline, lint всё ещё) |
| Security     | ⭐⭐⭐ (TLS, но headers хорошие)   | ⭐⭐⭐⭐ (TLS починен, headers хорошие)   |
| **Общая**    | **⭐⭐⭐⭐ из 5**                  | **⭐⭐⭐⭐½ из 5**                        |

**Резюме:** За 5 дней заметный прогресс — +136 unit-тестов, E2E покрытие выросло
с 3 до 15 спеков, бэкенд-контракт починен в 9 доменах, появился полноценный
pre-push pipeline, исправлен TLS. Основные нерешённые проблемы: сломанный
`npm run lint`, оставшиеся TS-ошибки в тестах (38 штук).
