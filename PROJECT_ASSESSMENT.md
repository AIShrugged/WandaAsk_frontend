# Оценка проекта AI Ask Wanda Frontend

**Дата:** 13 марта 2026

## Общие данные

| Метрика       | Значение                                      |
| ------------- | --------------------------------------------- |
| Стек          | Next.js 16 + React 19 + TypeScript (strict)   |
| Архитектура   | Feature Sliced Design (FSD)                   |
| Файлов TS/TSX | ~514                                          |
| Строк кода    | ~35,000                                       |
| Features      | 19 модулей                                    |
| Unit-тесты    | 161 suite / 1,022 tests — **все проходят ✅** |
| E2E тесты     | 3 spec-файла (auth, dashboard, profile)       |

---

## 🟢 Сильные стороны

### 1. Архитектура — отлично

- **FSD** реализован грамотно: 19 feature-модулей с чёткой изоляцией (ui/, api/,
  model/, types.ts, index.ts)
- Все 19 features имеют `index.ts` — публичный API соблюдён
- `shared/` хорошо структурирован: ui-кит (16 компонентов), lib (утилиты),
  hooks, types, store
- `entities/` выделены правильно (event, organization, participant, team, user)

### 2. Тестирование — очень хорошее

- **1,022 unit-теста — все зелёные** ✅
- Покрытие есть у всех ключевых features
- Jest + Testing Library — правильный выбор
- E2E настроен (Playwright), хотя пока 3 спеки

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

### 5. HTTP-клиент

- Централизованный `httpClient` с auth-хедерами, 401 redirect, типизацией
- Пагинация через `Items-Count` header — правильно отражает backend-контракт

---

## 🟡 Замечания (средний приоритет)

### 1. TypeScript ошибки — 41 ошибка

Все 41 ошибка в **тестовых файлах** (не в продакшн-коде). Тесты запускаются
через Jest (который не проверяет типы), поэтому проходят. Но `typecheck` падает
— CI/CD будет ломаться, если добавить `typecheck` в pipeline.

**Примеры:** неполные моки без `as unknown as Type`, несовпадение сигнатур.

### 2. Дублирование зависимостей motion

В `package.json` стоят **и `framer-motion` (3 МБ), и `motion` (484 КБ)** — это
одно и то же (motion — ребрендинг framer-motion). В коде используется только
`framer-motion`. Пакет `motion` лишний.

### 3. `eslint-plugin-jsdoc` в dependencies

Стоит в `dependencies` вместо `devDependencies` — попадает в продакшн-бандл.

### 4. `NODE_TLS_REJECT_UNAUTHORIZED = '0'`

Отключена проверка TLS-сертификатов **глобально** в `next.config.ts`. Даже с
комментарием «remove once backend has a valid cert» — это серьёзный security
risk для production.

### 5. `react-hooks/exhaustive-deps: 'off'`

Отключённое правило exhaustive-deps — источник потенциальных багов с
useEffect/useMemo/useCallback. Стоит включить хотя бы `warn`.

---

## 🔴 Проблемы (высокий приоритет)

### 1. Lint сломан

```
next lint → "Invalid project directory provided, no such directory: .../lint"
```

ESLint не запускается вообще. Husky pre-commit скорее всего тоже не блокирует.

### 2. Path alias `@/*` ведёт в корень, а не в `src/`

В `tsconfig.json`: `"@/*": ["./*"]` — все файлы (features, shared, entities,
widgets, app) лежат в **корне**, а не в `src/`. CLAUDE.md описывает `src/`
структуру, но реально `src/` не существует. Документация расходится с
реальностью.

### 3. E2E покрытие минимальное

Только 3 спека (auth, dashboard, profile). Критические flows (chat, teams,
calendar, meeting) не покрыты.

### 4. Zustand почти не используется

Zustand в зависимостях, но только 1 файл (`create-cached-list-store.ts`) его
использует. Стоит решить: либо использовать полноценно, либо убрать.

---

## Структура features

| Feature      | api | ui  | model | hooks | tests | index |
| ------------ | --- | --- | ----- | ----- | ----- | ----- |
| analysis     | ✗   | ✓   | ✓     | ✗     | 14    | ✓     |
| auth         | ✓   | ✓   | ✓     | ✗     | 4     | ✓     |
| calendar     | ✓   | ✓   | ✗     | ✗     | 11    | ✓     |
| chat         | ✓   | ✓   | ✓     | ✓     | 17    | ✓     |
| dashboard    | ✓   | ✓   | ✗     | ✗     | 2     | ✓     |
| demo         | ✓   | ✓   | ✗     | ✗     | 1     | ✓     |
| event        | ✓   | ✓   | ✓     | ✗     | 4     | ✓     |
| follow-up    | ✓   | ✓   | ✓     | ✗     | 3     | ✓     |
| landing      | ✗   | ✓   | ✓     | ✗     | 4     | ✓     |
| meeting      | ✗   | ✓   | ✗     | ✗     | 2     | ✓     |
| menu         | ✗   | ✓   | ✓     | ✗     | 3     | ✓     |
| methodology  | ✓   | ✓   | ✓     | ✗     | 8     | ✓     |
| organization | ✓   | ✓   | ✓     | ✗     | 7     | ✓     |
| participants | ✓   | ✓   | ✓     | ✗     | 5     | ✓     |
| summary      | ✓   | ✓   | ✗     | ✗     | 6     | ✓     |
| teams        | ✓   | ✓   | ✓     | ✗     | 9     | ✓     |
| transcript   | ✓   | ✓   | ✓     | ✗     | 5     | ✓     |
| user-profile | ✓   | ✓   | ✗     | ✗     | 2     | ✓     |
| user         | ✓   | ✓   | ✓     | ✗     | 5     | ✓     |

---

## Итоговая оценка

| Категория    | Оценка                             |
| ------------ | ---------------------------------- |
| Архитектура  | ⭐⭐⭐⭐⭐                         |
| Типизация    | ⭐⭐⭐⭐½ (тесты отстают)          |
| Тестирование | ⭐⭐⭐⭐ (unit отлично, E2E слабо) |
| Code Quality | ⭐⭐⭐⭐                           |
| DevOps/CI    | ⭐⭐⭐ (lint сломан)               |
| Security     | ⭐⭐⭐ (TLS, но headers хорошие)   |
| **Общая**    | **⭐⭐⭐⭐ из 5**                  |

**Резюме:** Зрелый, хорошо структурированный проект с сильной архитектурой и
тестами. Главные задачи: починить lint, исправить 41 TS-ошибку в тестах, убрать
отключение TLS, почистить неиспользуемые зависимости.
