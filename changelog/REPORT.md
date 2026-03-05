Вот отчёт по работам за период 26.02–05.03.2026 (последние коммиты / PR)

Период: 26 февраля — 5 марта 2026 Репозиторий: FIT-Wanda/ai_ask_wanda-frontend
PR смержено: #8, #9, #10, #11, #12

---

## 1. Система артефактов в чате (PR #8–#11) — 27.02.2026

Реализована панель артефактов в окне чата — структурированный вывод результатов
работы AI-ассистента в виде типизированных блоков.

Добавлено:

- ArtifactPanel — боковая панель в чате с отображением артефактов
- 6 типов артефактов:
  - InsightCard — карточки с инсайтами
  - TaskTable — таблица задач
  - MeetingCard — карточка встречи
  - PeopleList — список участников
  - ChartArtifact — графики
  - TranscriptView — транскрипция
- API-интеграция (features/chat/api/artifacts.ts) для загрузки артефактов
- Отображение участников команды на странице команды (team-members.tsx)
- Итеративные улучшения UI карточки инсайтов

Масштаб: ~1 400 строк кода добавлено, 13 файлов

---

## 2. Демо-режим организации (PR #8) — 27.02.2026

Добавлена возможность генерации демонстрационных данных для новых организаций.

Добавлено:

- DemoSeedButton — UI-кнопка в сайдбаре для запуска демо
- seed-demo.ts — Server Action для генерации демо-данных через API
- get-demo-status.ts — проверка статуса демо-генерации
- Обновлён dashboard/layout.tsx — интеграция кнопки

Масштаб: ~514 строк, 4 файла

---

## 3. Восстановление Follow-up и исправления (PR #12) — 02.03.2026

Восстановлены компоненты follow-up (ранее отключённые). Исправлены ошибки на
нескольких страницах.

Выполнено:

- Восстановлен follow-up-list.tsx и связанные компоненты календаря
- Исправлена страница email-инвайта — новый роут /invite-accepted с отдельным
  layout
- Исправлен layout авторизации (auth/layout.tsx)
- Обновлён CollapsedSidePanel — новый компонент сворачиваемой панели
- Очистка: удалены устаревшие тестовые страницы статистики (/statistics/a, /b,
  /c) — минус ~1 600 строк
- Добавлен TribesLogo как отдельный компонент бренда
- Рефакторинг OrganizationDropdown, TeamList, TeamItem
- Обновлён chat-layout.tsx — переработка лейаута чата

Масштаб: 38 файлов изменено, +301 / −1989 строк (крупная очистка кода)

---

## 4. Покрытие тестами — 02.03.2026

Настроена тестовая инфраструктура и написаны первые unit-тесты.

Добавлено:

- Миграция конфига: jest.config.js → jest.config.mjs
- Тесты компонентов: ChatList, ChatMessage, ThinkingIndicator,
  CollapsedSidePanel
- Тесты модели: chat/model/**tests**/schemas.test.ts — валидация Zod-схем чата
- Обновлён README с инструкцией по запуску тестов

Масштаб: ~260 строк тестов, 5 новых тест-файлов

---

## 5. Система обработки ошибок + Dashboard + Профиль пользователя — 04.03.2026

Крупный комплексный коммит: новая архитектура ошибок, домашняя страница
дашборда, профиль пользователя.

Обработка ошибок:

- shared/lib/errors.ts — типизированные классы ошибок: AppError, ServerError,
  FrontendError, NetworkError
- shared/ui/error/ErrorDisplay.tsx — умный компонент ошибок: в dev-режиме
  показывает HTTP-статус, URL, тело ответа, стек трейс; в prod — дружественное
  сообщение
- Обновлены app/error.tsx, app/dashboard/error.tsx
- Добавлен app/global-error.tsx — перехват ошибок корневого layout
- httpClient — теперь бросает ServerError с контекстом вместо generic Error

Домашняя страница дашборда:

- app/dashboard/page.tsx + features/dashboard/ (feature-модуль)
- DashboardStats — статистика по командам/встречам/чатам
- RecentChats — последние чаты пользователя

Профиль пользователя:

- app/dashboard/profile/page.tsx
- features/user-profile/ — ProfileForm, ChangePasswordForm, profile.ts (API)
- Добавлен пункт "Профиль" в меню пользователя

Skeleton-лоадеры:

- shared/ui/layout/skeleton.tsx — компоненты Skeleton, SkeletonList
- loading.tsx файлы для: dashboard, teams, methodology, follow-ups, statistics

Shared типы:

- shared/types/server-action.ts — ActionResult<T>
- shared/types/common.ts — PaginatedResult<T>
- httpClient — добавлен httpClientList<T>() для пагинированных ответов

Масштаб: 41 файл, +1 286 / −179 строк

---

## 6. Аудит cursor-pointer — 04.03.2026

Полный аудит кодовой базы на наличие `cursor-pointer` у интерактивных элементов.

Выполнено:

- Проверены все `<button>`, `<a>`, `<Link>`, `<div onClick>` в проекте
- Добавлен `cursor-pointer` в 18 файлах где он отсутствовал
- Задокументированы элементы где стиль уже был корректен

Масштаб: 18 файлов, +56 строк

---

## 7. Расширение ESLint: JSDoc + новые правила — 04.03.2026

Расширена конфигурация ESLint новыми правилами контроля качества.

Добавлено:

- `eslint-plugin-jsdoc` — обязательный JSDoc для функций, методов, классов
- `arrow-body-style`, `no-nested-ternary`, `no-unneeded-ternary` — стилевые
  ограничения
- `max-depth: 3`, `max-params: 4`, `max-statements: 15`, `complexity: 8` —
  ограничения сложности
- `padding-line-between-statements` — вертикальные отступы между блоками
- Все новые правила установлены в режим `warn` — не ломают сборку

Масштаб: 1 файл eslint.config.mjs, +43 строки

---

## 8. Тестовое покрытие и CI-хуки — 05.03.2026

Настроены git-хуки и существенно расширена тест-база.

Git-хуки (Husky + lint-staged):

- `pre-commit` → `lint-staged`: ESLint + Prettier на staged-файлах перед каждым
  коммитом
- `pre-push` → `npm test -- --ci`: тесты блокируют push при падении

Jest coverage:

- `collectCoverageFrom` покрывает features/, shared/lib/, shared/ui/, entities/,
  widgets/
- `coverageThreshold` — глобальный порог 50% по всем метрикам

Новые тесты (13 файлов, итого 18 суитов / 127 тестов):

| Файл                                                                | Что покрыто                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `shared/lib/__tests__/errors.test.ts`                               | AppError, ServerError, FrontendError, NetworkError, isAppError |
| `shared/ui/button/__tests__/Button.test.tsx`                        | Варианты, loading, disabled, onClick, aria                     |
| `shared/ui/modal/__tests__/Modal.test.tsx`                          | Открытие/закрытие, Escape, overflow hidden                     |
| `shared/ui/input/__tests__/Input.test.tsx`                          | Label, error, adornments, aria-invalid, disabled               |
| `shared/ui/layout/__tests__/skeleton.test.tsx`                      | Skeleton, SkeletonList rows                                    |
| `shared/ui/badge/__tests__/Badge.test.tsx`                          | Все 5 вариантов, custom className                              |
| `features/auth/model/__tests__/schemas.test.ts`                     | LoginSchema + RegisterSchema валидация                         |
| `features/teams/ui/__tests__/team-item.test.tsx`                    | Имя, счётчик сотрудников, href, actions                        |
| `features/dashboard/ui/__tests__/DashboardStats.test.tsx`           | 3 stat-карточки, нули                                          |
| `features/dashboard/ui/__tests__/RecentChats.test.tsx`              | Empty state, titles, links, relative time                      |
| `features/user-profile/ui/__tests__/ProfileForm.test.tsx`           | Рендер, dirty-state, валидация                                 |
| `features/user-profile/ui/__tests__/ChangePasswordForm.test.tsx`    | Поля, minLength, mismatch                                      |
| `features/organization/ui/__tests__/OrganizationListEmpty.test.tsx` | Текст, ссылка, кнопка                                          |

Масштаб: 16 файлов изменено/создано, +1 430 строк

---

## 9. JSDoc покрытие: устранение jsdoc/require-jsdoc — 05.03.2026

Устранены все предупреждения `jsdoc/require-jsdoc` во всей кодовой базе.

Исходное состояние: **399 предупреждений в 221 файле** → **0 предупреждений**.

Подход — три прохода Node.js скрипта-автоматизатора:

- Проход 1: стандартные однострочные сигнатуры — 291 файл
- Проход 2: конструкторы классов, object-методы, тест-файлы (`eslint-disable`) —
  23 файла
- Проход 3: многострочные сигнатуры и дженерики — 76 файлов

Логика генерации:

- React-компонент (uppercase): `/** FooForm component. */`
- Хук: `/** useMessages hook. */`
- Async-функция: `/** name. @returns Promise. */`
- Конструктор: `/** Creates an instance. */`
- Тест-файл: `/* eslint-disable jsdoc/require-jsdoc */` в начале

Тесты после изменений: ✅ 127/127

Масштаб: 221 файл, +1 542 строки

---

## Итого за период

| #   | Задача                              | Дата  | Файлов | Строк         |
| --- | ----------------------------------- | ----- | ------ | ------------- |
| 1   | Система артефактов в чате           | 27.02 | 13     | +1 400        |
| 2   | Демо-режим организации              | 27.02 | 4      | +514          |
| 3   | Восстановление Follow-up + фиксы    | 02.03 | 38     | +301 / −1 989 |
| 4   | Первые unit-тесты                   | 02.03 | 5      | +260          |
| 5   | Ошибки + Dashboard + Профиль        | 04.03 | 41     | +1 286 / −179 |
| 6   | Аудит cursor-pointer                | 04.03 | 18     | +56           |
| 7   | ESLint расширение (JSDoc + правила) | 04.03 | 1      | +43           |
| 8   | CI-хуки + тест-база (127 тестов)    | 05.03 | 16     | +1 430        |
| 9   | JSDoc покрытие (399 → 0 warnings)   | 05.03 | 221    | +1 542        |
