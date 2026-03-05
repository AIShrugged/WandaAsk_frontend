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

## 10. Backend: GET /api/v1/dashboard — 05.03.2026

Реализован эндпоинт для получения агрегированной статистики дашборда.

`GET /api/v1/dashboard` (требует авторизации)

Возвращает шесть блоков данных:

**Встречи (meetings):**

- Общее количество встреч
- Количество встреч с ботом
- Суммарная и средняя длительность (в минутах)
- Последние 10 встреч с деталями
- Статистика по месяцам для построения графиков

**Участники (participants):**

- Уникальное число участников
- Среднее количество участников на встречу
- Топ-10 участников по частоте присутствия

**Задачи (tasks):**

- Общее количество задач
- Разбивка по статусам: open / in_progress / done / cancelled
- Количество просроченных задач

**Follow-up'ы (followups):**

- Общее количество follow-up'ов
- Разбивка по статусам: done / in_progress / failed

**Резюме (summaries):**

- Количество сгенерированных резюме встреч

**Команды (teams):**

- Общее число команд
- Список команд с названиями и количеством участников

---

## 11. Frontend: страница /dashboard/summary — 05.03.2026

Реализована страница сводного отчёта на основе данных `GET /api/v1/dashboard`.

Добавлено:

- `features/summary/types.ts` — TypeScript-интерфейсы для всех шести блоков API
- `features/summary/api/summary.ts` — Server Action `getSummaryData()`
- `features/summary/ui/SummaryHeader.tsx` — заголовок страницы с текущей датой
- `features/summary/ui/MeetingStats.tsx` — раздел встреч: 3 суб-стата, BarChart
  по месяцам, таблица последних 10 встреч
- `features/summary/ui/TaskStats.tsx` — раздел задач: PieChart по статусам,
  бейдж просроченных
- `features/summary/ui/FollowupStats.tsx` — раздел follow-up'ов: PieChart по
  статусам
- `features/summary/ui/ParticipantStats.tsx` — раздел участников: 2 стата,
  горизонтальный BarChart топ-10
- `features/summary/ui/TeamStats.tsx` — раздел команд: горизонтальный BarChart
  размеров команд
- `app/dashboard/summary/page.tsx` — SSR-страница: 5 KPI-карточек + все секции
- `app/dashboard/summary/loading.tsx` — skeleton-лоадер под всю структуру
- `shared/lib/routes.ts` — добавлен `ROUTES.DASHBOARD.SUMMARY`

Поля типов выверены по реальным DTO бэкенда (`MeetingStatsDTO`,
`ParticipantStatsDTO` и др.). Все chart-компоненты — `'use client'` (recharts);
страница и секционные компоненты — Server Components.

Масштаб: 11 файлов, ~500 строк

---

## 12. CLAUDE.md: навигация по бэкенд-репозиторию — 05.03.2026

Добавлена секция "Backend Repository" в `CLAUDE.md` — обязательные правила для
Claude Code при работе с API.

Содержание:

- Путь к локальному бэкенду: `/Users/slavapopov/Documents/WandaAsk_backend`
- Когда обязательно читать бэкенд: реализация Server Action, типизация ответа,
  отладка 4xx/5xx, добавление нового эндпоинта
- Таблица навигации: routes/api.php → Request → Resource → Service → Errors →
  Models → Enums → Agent Tools
- Формат envelope-ответа (`success`, `data`, `message`, `status`, `meta`)
- Правила аутентификации (Bearer-токен из cookie `token`)

Масштаб: 1 файл CLAUDE.md, ~50 строк

---

## 13. Аудит и настройка Claude Code агентов — 05.03.2026

Проведён аудит агентов Claude Code в `.claude/agents/`. Исправлены устаревшие
данные, добавлена поддержка синхронизации артефактов между бэкендом и
фронтендом.

**Исправлен `wanda-backend-navigator.md`:**

- Устаревшая ссылка на `useToast()` заменена на `toast.error()` из `sonner`
- Добавлена строка `routes/ai.php` в карту навигации (MCP/AI эндпоинты)
- Добавлен путь `app/Domain/DTO/<Domain>/<Name>DTO.php` — для эндпоинтов,
  которые возвращают данные через DTO, а не Resource (например, `/dashboard`)
- Добавлена строка `CreateArtifactTool.php` как источник схем данных артефактов

**Обновлён `CLAUDE.md`:**

- Таблица навигации дополнена строками для DTO и `routes/ai.php`
- Уточнено правило по типизации: читать Resource **или** DTO — в зависимости от
  того, что использует контроллер

**Создан новый агент `artifact-sync.md`:**

- Назначение: синхронизация типов артефактов между бэкендом и фронтендом
- Читает `CreateArtifactTool.php` и `ArtifactType.php` как источник истины
- Сверяет со списком рендереров в `features/chat/ui/artifacts/`
- Добавляет новые рендереры и обновляет TypeScript-union при расхождениях
- Покрывает кейс: backend добавил новый тип → frontend нужен новый компонент

**Выявленная точка рассинхронизации:**

| Backend (`ArtifactType` enum) | Frontend renderer   |
| ----------------------------- | ------------------- |
| task_table                    | task-table.tsx      |
| meeting_card                  | meeting-card.tsx    |
| people_list                   | people-list.tsx     |
| insight_card                  | insight-card.tsx    |
| chart                         | chart-artifact.tsx  |
| transcript_view               | transcript-view.tsx |

При добавлении 7-го типа на бэкенде — запустить агент `artifact-sync`.

Масштаб: 3 файла изменено/создано

---

---

## 14. Перевод /dashboard/summary на английский — 05.03.2026

Весь пользовательский интерфейс страницы статистики переведён с русского на
английский. Правило закреплено: **интерфейс приложения — только английский**.

Переведены файлы:

| Файл                                       | Было → Стало                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `features/summary/ui/SummaryHeader.tsx`    | «Сводный отчёт» → «Summary Report»; убран `locale: ru`             |
| `features/summary/ui/MeetingStats.tsx`     | Все подписи, заголовки таблицы, «мин» → «min»; убран `ru`          |
| `features/summary/ui/TaskStats.tsx`        | Статусы и заголовок «Задачи» → «Tasks», «Открытые» → «Open» и т.д. |
| `features/summary/ui/FollowupStats.tsx`    | Статусы donut-диаграммы переведены                                 |
| `features/summary/ui/ParticipantStats.tsx` | «Участники», «Топ», «Ср.» → English-варианты                       |
| `features/summary/ui/TeamStats.tsx`        | «Команды», «Размеры» → «Teams», «Team sizes»                       |
| `app/dashboard/summary/page.tsx`           | KPI-карточки: «Встречи» → «Meetings» и т.д.                        |

---

## 15. Unit-тесты для features/summary — 05.03.2026

Добавлено 4 тест-файла, 27 тестов — все проходят.

| Файл                                                      | Тестов |
| --------------------------------------------------------- | ------ |
| `features/summary/ui/__tests__/MeetingStats.test.tsx`     | 9      |
| `features/summary/ui/__tests__/TaskStats.test.tsx`        | 5      |
| `features/summary/ui/__tests__/ParticipantStats.test.tsx` | 5      |
| `features/summary/ui/__tests__/TeamStats.test.tsx`        | 5      |
| `features/summary/ui/__tests__/FollowupStats.test.tsx`    | 3      |

Покрывают: заголовки секций, KPI-значения, пустые состояния (empty state),
условный рендеринг диаграмм, overdue-бейдж. `recharts` замокан
(ResponsiveContainer → plain `<div>`).

---

## 16. Фикс бэкенда: MeetingStatsService (500 Internal Server Error) — 05.03.2026

Эндпоинт `GET /api/v1/dashboard` возвращал 500 из-за трёх ошибок в
`app/Services/Dashboard/MeetingStatsService.php`:

1. **`has_bot` → `required_bot`** — колонка была переименована миграцией
   `2025_11_26_163220_rename_column_has_bot_on_calendar_events_table.php`, но
   сервис не был обновлён.

2. **`TIMESTAMPDIFF(MINUTE, ...)` → `EXTRACT(EPOCH FROM ...) / 60`** —
   `TIMESTAMPDIFF` — MySQL-функция, не поддерживается PostgreSQL.

3. **`DATE_FORMAT(starts_at, '%Y-%m')` → `TO_CHAR(starts_at, 'YYYY-MM')`** —
   аналогично, MySQL-специфичный синтаксис.

Файл: `app/Services/Dashboard/MeetingStatsService.php` (бэкенд-репозиторий)

---

## Итого за период

| #   | Задача                                 | Дата  | Файлов | Строк         |
| --- | -------------------------------------- | ----- | ------ | ------------- |
| 1   | Система артефактов в чате              | 27.02 | 13     | +1 400        |
| 2   | Демо-режим организации                 | 27.02 | 4      | +514          |
| 3   | Восстановление Follow-up + фиксы       | 02.03 | 38     | +301 / −1 989 |
| 4   | Первые unit-тесты                      | 02.03 | 5      | +260          |
| 5   | Ошибки + Dashboard + Профиль           | 04.03 | 41     | +1 286 / −179 |
| 6   | Аудит cursor-pointer                   | 04.03 | 18     | +56           |
| 7   | ESLint расширение (JSDoc + правила)    | 04.03 | 1      | +43           |
| 8   | CI-хуки + тест-база (127 тестов)       | 05.03 | 16     | +1 430        |
| 9   | JSDoc покрытие (399 → 0 warnings)      | 05.03 | 221    | +1 542        |
| 10  | Backend: GET /api/v1/dashboard         | 05.03 | —      | —             |
| 11  | Frontend: /dashboard/summary           | 05.03 | 11     | +500          |
| 12  | CLAUDE.md: навигация по бэкенду        | 05.03 | 1      | +50           |
| 13  | Аудит и настройка Claude Code агентов  | 05.03 | 3      | —             |
| 14  | Перевод /dashboard/summary на English  | 05.03 | 7      | ~80           |
| 15  | Unit-тесты: features/summary (27 тест) | 05.03 | 4      | +280          |
| 16  | Фикс бэкенда: MeetingStatsService      | 05.03 | 1      | +8 / −8       |
