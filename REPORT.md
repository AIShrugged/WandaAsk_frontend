# WandaAsk Frontend — Отчёт о работе

## [2026-03-12]

### 🤖 Агентная система — аудит и расширение

#### Улучшения существующих агентов (5)

**`design-guardian`**

- Описание (description) переведено на английский для единообразия с остальными
  агентами
- Добавлена поддержка persistent memory (`memory: project`) — агент теперь
  запоминает что уже аудировал между сессиями
- Создана директория `.claude/agent-memory/design-guardian/` с `MEMORY.md`

**`artifact-sync`**

- Добавлен обязательный финальный шаг верификации: TypeScript check + ESLint
  после каждого изменения artifact renderer'а
- Ранее агент писал код и завершался без проверки корректности

**`mr-reviewer`**

- Добавлен чеклист **C4.12 Accessibility** (10 пунктов: ARIA labels, focus trap
  в модалках, aria-live для loading states, запрет tabIndex > 0 и др.)
- Добавлена секция **C4.13 Delegation** — явные инструкции делегировать глубокий
  анализ в специализированные агенты (`fsd-boundary-guard`,
  `backend-contract-validator`, `unit-test-booster`, `design-guardian`)

**`fsd-boundary-guard`**

- Добавлен **FIX режим** (триггер: "fix FSD") — автоматически исправляет Rule 3
  нарушения (глубокие импорты → index.ts public API)
- Rule 1/2/4 нарушения по-прежнему только репортируются (требуют архитектурного
  решения)

**`backend-contract-validator`**

- Добавлен **FIX режим** (триггер: "fix types") — перезаписывает TypeScript
  интерфейсы по PHP Resource/DTO, также обновляет связанные Zod схемы
- После применения фиксов запускает `tsc --noEmit` для верификации

#### Новые агенты (3)

**`unit-test-booster`**

- Режимы: AUDIT (карта покрытия) и WRITE (генерация тестов)
- Встроено знание всех проектных моков: sonner, framer-motion,
  motion/react-client, next/navigation, next/link
- Знает нюансы: IntersectionObserver mock, async Server Components через
  `await Component()`, isDev тестирование через `jest.resetModules()`
- Шаблоны для каждого типа: форма, хук, Server Action, утилита, Zod схема

**`performance-auditor`**

- Находит ненужные `'use client'` директивы (компонент без интерактивности)
- Детектирует тяжёлые импорты в Server Components (framer-motion, recharts без
  dynamic import)
- Проверяет raw `<img>` вместо `next/image`, inline object props в рендере
- Умеет применять фиксы: `next/dynamic` с `ssr: false` + Skeleton loading

**`changelog-writer`**

- Читает `git log` + diff, понимает контекст по коду
- Генерирует структурированные записи в REPORT.md на русском (конвенция проекта)
- Категории: ✨ новые функции, 🔧 улучшения, 🐛 исправления, 🎨 дизайн, 🧪
  тесты, 🏗️ инфраструктура, ♻️ рефакторинг, 🔒 безопасность

---

### 🔔 Telegram уведомления для pre-push

#### Что добавлено

**`scripts/pre-push-checks.sh`** — новый скрипт с полным циклом проверок:

- Загружает `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` из `.env.local`
- **Шаг 0 — Авто-фикс**: запускает `eslint --fix` + `prettier --write`, при
  наличии изменений автоматически создаёт коммит
  `chore: auto-fix lint and format [pre-push]`
- **Шаг 1 — ESLint**: только реальные ошибки блокируют пуш, warnings выводятся
  счётчиком
- **Шаг 2 — TypeScript**: `tsc --noEmit`
- **Шаг 3 — Tests**: Jest CI

**`.husky/pre-push`** — заменён с `npm test -- --ci --passWithNoTests` на вызов
нового скрипта

**`.env.example`** — создан с документацией всех переменных окружения включая
Telegram

#### Формат Telegram уведомления

```
✅ Pre-push check

📌 Branch: feature/my-branch
💬 abc1234 Fix team member roles
👤 Slava Popov
⚡ Auto-fixed and committed 2 file(s)

Checks:
  ✅ ESLint (12s) (332 warnings)
  ✅ TypeScript (8s)
  ✅ Tests (22s)
  Tests: 570 passed  Test Suites: 99 passed

✅ All checks passed — push allowed
```

#### Graceful degradation

Если `TELEGRAM_BOT_TOKEN` не задан — скрипт работает без уведомлений. Другие
разработчики без настроенного бота не блокируются.

---

### 📊 Расширенная статистика в Telegram уведомлениях

#### `scripts/push.sh` — post-push уведомление

Добавлен блок `📊 Push stats:` с данными о каждом пуше:

- `🔢 Commits: N` — количество запушенных коммитов
- `📁 Files changed: N` — количество изменённых файлов
- `➕ +N lines ➖ -N lines` — строки добавленные/удалённые
- `⏱ Push time: Ns` — время выполнения push
- `Commits:` список коммитов (до 7 штук в хронологическом порядке)

Статистика вычисляется через `git diff --shortstat REMOTE_BEFORE..HEAD` и
`git rev-list --count`, где `REMOTE_BEFORE` — HEAD удалённого репозитория до
push. Если ветка новая (нет remote ref) — показывает `🆕 New branch pushed`.

#### `scripts/pre-push-checks.sh` — pre-push уведомление

Добавлены два новых блока:

**`📦 Ready to push:`** — вычисляется сразу при старте скрипта (до проверок):

- Количество коммитов, файлов, строк +/- относительно `origin/<branch>`
- Список коммитов (до 7 штук)
- Для новых веток: `🆕 New branch — N commit(s)`

**`⏱ Total: Ns`** — суммарное время всех шагов (авто-фикс + ESLint + TypeScript
\+ Tests)

#### Пример итогового уведомления pre-push

```
✅ Pre-push check

📌 Branch: master
💬 abc1234 chore: add push statistics
👤 Slava Popov

📦 Ready to push:
  🔢 Commits: 3  📁 Files: 8
  ➕ +127 lines  ➖ -12 lines
    • abc1234 feat: add statistics to notifications
    • def5678 fix: handle new branch edge case
    • ghi9012 chore: update REPORT.md

Checks:
  ✅ passed (332 warnings) ESLint (14s)
  ✅ passed TypeScript (9s)
  ✅ passed Tests (24s)
  ⏱ Total: 51s

✅ All checks passed — push allowed
```

---

## [до 2026-03-12] — Предыдущие изменения

### 🎨 Cosmic Design System (PR #13)

- Тёмная космическая тема: violet primary, terminal green accent, deep space
  background
- Новые компоненты: Button с gradient + glow эффектами, ButtonIcon, Badge, Card
- CSS токены: `--radius-button`, `--radius-card`, `--radius-panel`,
  `--shadow-card`
- Анимации: `cosmic-twinkle`, `cosmic-float`, `cosmic-glow-pulse`
- Фоновый компонент `cosmic-background.tsx`

### 🤖 Агенты и MCP (коммит f7eae06)

- Настроен MCP сервер `playwright` для browser automation в E2E тестах
- Настроен MCP сервер `wanda-backend` — прямой доступ к Laravel HR API (14
  инструментов)
- Добавлены кастомные агенты: `fsd-boundary-guard`,
  `backend-contract-validator`, `e2e-coverage-agent`

### 🧪 Тесты (коммит 763bd74)

- Покрытие ~90% (Jest 30 + React Testing Library 16)
- Настроен Husky pre-push hook с запуском тестов
- Playwright E2E инфраструктура с auth через storageState

### 🔧 Инфраструктура

- Error handling system: `AppError`, `ServerError`, `FrontendError` +
  `ErrorDisplay` компонент
- Sonner вместо react-toastify (12 файлов мигрировано)
- Network debug: server-side `patchServerFetch` + client `DevDebugProvider`
- Skeleton loaders: `Skeleton`, `SkeletonList` из
  `shared/ui/layout/skeleton.tsx`
- Home Dashboard и User Profile страницы

### 👤 Функциональность

- Смена пароля и редактирование профиля
- Follow-ups и analysis страницы
- Calendar интеграция
- Статистика и дашборд
