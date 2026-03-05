# 2026-03-05 — Тестовое покрытие и CI-хуки

## Что делали

Настроили git-хуки для автоматической проверки качества кода и написали тесты для всех ключевых модулей приложения.

Добавлено 13 новых тест-файлов — итого **18 тест-суитов, 127 тестов**. Тесты теперь блокируют `git push` при падении.

---

## Git-хуки (Husky)

Установлен Husky + lint-staged. Настроены два хука:

| Хук | Команда | Когда срабатывает |
|-----|---------|-------------------|
| `pre-commit` | `lint-staged` (ESLint + Prettier на staged-файлах) | Перед каждым коммитом |
| `pre-push` | `npm test -- --ci` | Перед каждым push — блокирует если тесты красные |

Конфигурация `lint-staged` добавлена в `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs,json,css,md}": "prettier --write"
}
```

---

## Jest: конфигурация coverage

Обновлён `jest.config.mjs`:

- `collectCoverageFrom` — покрывает `features/**`, `shared/lib/**`, `shared/ui/**`, `entities/**`, `widgets/**`
- `coverageThreshold` — глобальный порог **50%** по branches / functions / lines / statements
- Исключены: `api/**`, `index.ts`, `*.d.ts`, `__tests__/**`

---

## Новые тест-файлы

### shared/

| Файл | Что покрыто |
|------|-------------|
| `shared/lib/__tests__/errors.test.ts` | `AppError`, `ServerError`, `FrontendError`, `NetworkError`, `isAppError` — все конструкторы, опции, наследование |
| `shared/ui/button/__tests__/Button.test.tsx` | Все 3 варианта, `loading`, `disabled`, `onClick`, `aria-disabled`, forwarded props |
| `shared/ui/modal/__tests__/Modal.test.tsx` | Открытие/закрытие, Escape-клавиша, `overflow: hidden` на body, backdrop |
| `shared/ui/input/__tests__/Input.test.tsx` | Label, error (string/boolean), adornments, `aria-invalid`, disabled |
| `shared/ui/layout/__tests__/skeleton.test.tsx` | `Skeleton` (className), `SkeletonList` (количество строк по умолчанию и кастомное) |
| `shared/ui/badge/__tests__/Badge.test.tsx` | Все 5 вариантов (default/primary/success/warning/destructive), custom className |

### features/

| Файл | Что покрыто |
|------|-------------|
| `features/auth/model/__tests__/schemas.test.ts` | `LoginSchema` и `RegisterSchema` — валидные данные, ошибки email/password/name, пробелы в начале/конце имени, опциональный `invite` |
| `features/teams/ui/__tests__/team-item.test.tsx` | Имя команды, счётчик сотрудников (0/1/N), формирование `href`, проброс `actions` |
| `features/dashboard/ui/__tests__/DashboardStats.test.tsx` | Три stat-карточки (Teams/Chats/Methodologies), нулевые значения |
| `features/dashboard/ui/__tests__/RecentChats.test.tsx` | Empty state, заголовки чатов, "Untitled chat", ссылки на чаты, relative time |
| `features/user-profile/ui/__tests__/ProfileForm.test.tsx` | Рендер с данными пользователя, disabled-состояние кнопки до редактирования, валидация required |
| `features/user-profile/ui/__tests__/ChangePasswordForm.test.tsx` | Все три поля, минимальная длина пароля, несовпадение паролей |
| `features/organization/ui/__tests__/OrganizationListEmpty.test.tsx` | Текст приглашения, ссылка на создание, кнопка |

---

## Моки

Стандартные моки, используемые по всей тест-базе:

| Модуль | Что мокируется |
|--------|----------------|
| `next/link` | Простой `<a href>` |
| `framer-motion` | `motion.div` → `<div>`, `AnimatePresence` → fragment |
| `sonner` | `toast.error`, `toast.success` → `jest.fn()` |
| `next/navigation` | `useRouter`, `usePathname`, `useSearchParams` → `jest.fn()` |
| Server Actions (`api/*`) | `jest.fn(() => Promise.resolve({ error: null }))` |

---

## Строки кода

| Этап | Описание | Строк |
|------|----------|-------|
| Изучение кодовой базы | Чтение ~25 файлов (компоненты, типы, схемы) | ~800 |
| Настройка инфраструктуры | Husky, lint-staged, jest.config.mjs | 30 |
| 13 тест-файлов | Написание тестов | ~600 |
| Отладка | Исправление 2 ошибок (опечатка `coverageThresholds`, ambiguous label match) | — |

**Итого: ~1 430 строк** (просмотрено + написано)

---

## Проблемы и решения

### 1. Опечатка в jest.config.mjs
`coverageThresholds` (неверно) → `coverageThreshold` (верно). Jest сообщил об этом как validation warning.

### 2. Ambiguous label в ChangePasswordForm
`getByLabelText(/new password/i)` матчил оба лейбла: «New password» и «Confirm **new** password».

**Решение:** использован точный string-матч `getByLabelText('New password')`.

---

## Вывод

**Сильные стороны:**

- Полный цикл защиты: lint на коммит + тесты на push — ни сломанный стиль, ни упавшие тесты не попадут в репозиторий
- 127 тестов покрывают все слои: чистая логика (error classes, Zod schemas), UI-компоненты (Button, Input, Modal, Badge), составные компоненты (TeamItem, DashboardStats, RecentChats, ProfileForm)
- Единый стиль моков: переиспользуемые паттерны для next/link, framer-motion, sonner, server actions
- Быстрый прогон: 18 суитов выполняются за ~1.5 секунды

**Слабые стороны:**

- Server Actions (`api/**`) исключены из coverage — они требуют интеграционных тестов с мок-сервером
- Интерактивные компоненты с тяжёлыми зависимостями (TeamActions с Zustand + next/navigation) тестируются через stub-мок, не сквозной интеграцией
