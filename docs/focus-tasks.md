# Focus Tasks

## Что это

Пользователь задаёт текстовый "фокус" — текущий приоритет или спринт-цель
(например, "v2.0 до 25 апреля"). На основе фокуса система подбирает релевантные
задачи через полнотекстовый поиск и показывает их в нескольких местах.

---

## Где хранится

**Таблица:** `insight_short_term` **Модель:** `App\Models\InsightShortTerm`

| Поле           | Значение                                                                          |
| -------------- | --------------------------------------------------------------------------------- |
| `context_type` | `user_focus` (enum `InsightContextType::USER_FOCUS`)                              |
| `content`      | JSON: `{ focus_text: string, deadline: string\|null, issue_ids: number[]\|null }` |
| `expires_at`   | Дедлайн + конец дня, или +14 дней если дедлайн не задан                           |
| `profile_id`   | Профиль пользователя                                                              |

Сервис: `App\Services\UserFocusService` — `setFocus`, `getFocus`, `clearFocus`.

---

## API

| Метод    | Эндпоинт                    | Что делает                                            |
| -------- | --------------------------- | ----------------------------------------------------- |
| `GET`    | `/api/v1/me/focus`          | Получить активный фокус                               |
| `PUT`    | `/api/v1/me/focus`          | Установить/обновить фокус (`focus_text`, `deadline?`) |
| `DELETE` | `/api/v1/me/focus`          | Удалить фокус                                         |
| `GET`    | `/api/v1/me/issues/focused` | Задачи по фокусу (full-text + critical fallback)      |

Ответ `/me/issues/focused` включает `meta.has_focus`, `meta.focus_text`,
`meta.matched_count`.

---

## Как подбираются фокусные задачи

`FocusedIssuesController` (и `GetFocusedIssuesTool` для агента) — три уровня
fallback:

1. **Explicit ids** — если при сохранении фокуса переданы `issue_ids`,
   загружаются именно эти задачи в том порядке, что задал пользователь. Фильтр:
   `status NOT IN ('done', 'closed', 'cancelled')`, только задачи юзера. IDs
   невалидных/чужих задач отбрасываются (`UserFocusService::validateIssueIds`).
2. **Full-text search** — если `issue_ids` нет (тематический фокус), ищет через
   PostgreSQL:
   ```sql
   to_tsvector('russian', name || ' ' || description) @@ plainto_tsquery('russian', $focusText)
   ```
   Фильтр: `status NOT IN ('done', 'closed', 'cancelled')`,
   `assignee_id = $userId OR user_id = $userId`, лимит 10.
3. **Critical fallback** — если FTS ничего не нашло: задачи с `priority >= 500`
   (CRITICAL), лимит 5.
4. Если фокус не задан — возвращает `meta.has_focus: false`, данные пустые.

---

## Где отображается (фронтенд)

### 1. Блок редактирования фокуса

`features/user-focus/ui/focus-block.tsx` → `<FocusBlock>`

- **Editable** — `/dashboard/profile/account`
- **Readonly** — `/dashboard/today/tasks` (показывает текст фокуса, дедлайн)
- `focus_text` рендерится через `react-markdown` + `remarkGfm`
- Просроченный фокус — зелёный "Focus completed!" с кнопкой сброса

### 2. Баннер-напоминание

`features/user-focus/ui/focus-reminder-banner.tsx` → `<FocusReminderBanner>`

- Показывается в layout страниц `/dashboard/issues`
- Dismissible (sessionStorage)
- Текст фокуса тоже рендерится через markdown

### 3. Блок фокусных задач

`features/user-focus/ui/focused-tasks-block.tsx` → `<FocusedTasksBlock>`

- **Server Component**, вызывает `getFocusedIssues()` при рендере
- Показывается на:
  - `/dashboard/today/tasks` — между FocusBlock и TaskStatsBlock
  - `/dashboard/issues/(list)/list` — над списком задач
- Состояния:
  - Нет фокуса → ссылка "Set your focus" на `/dashboard/profile/account`
  - Фокус есть, задач нет → "No tasks match your current focus"
  - Есть задачи → карточки со ссылками на `/dashboard/issues/{id}`
  - Fallback (critical) → пометка "(critical priority)"

### 4. Список задач (Issues table)

`features/issues/ui/issues-page.tsx`

- Колонка **Priority** — текстовый label с цветом
  (Critical/High/Normal/Low/Minimal), сортируемая
- Колонка **Deadline** — `due_date` с относительной меткой (overdue/today/N days
  left), сортируемая

### 5. В чате

- `entities/artifact/ui/task-table.tsx` — рендерит `task_table` артефакты
  (поддерживает статусы: open, in_progress, done, closed, paused, review,
  reopen)
- `features/chat/ui/chat-message-content.tsx` — если агент прислал ` ```json `
  массив с задачами, рендерит как `<TaskTable>` inline

---

## Как работает в AI-чате (агент)

### Подкейс: без даты/спринта/синка

Пользователь просит список задач или рекомендацию без контекста:

- "Покажи мои активные задачи" → агент вызывает `get_open_issues` (`assignee_id`
  из сессии, `statuses=open,in_progress`). Возвращает `days_since_update` —
  агент видит залежавшиеся задачи.
- "На чём мне сфокусироваться?" → `build_daily_plan(scope=personal)` — задачи
  отсортированы по `priority DESC`, `due_date ASC`, включают
  `blocked_by`/`blocking`. Агент сам формулирует «Сегодня: … / Остальное: …».

### Подкейс: с датой / спринтом / синком

- "Задачи по итогам планирования в пятницу" →
  `get_tasks(calendar_event_id=<id>)` — задачи привязаны к конкретной встрече
  (`sourceable_id`).
- "Что нужно закрыть на этой неделе" → `get_tasks(due_before="2026-05-04")`.
- "Задачи команды на спринт" → `build_daily_plan(scope=team, team_id=<id>)`.

### Подкейс: установка и корректировка фокуса

Агент вызывает `set_user_focus` когда пользователь явно говорит о своём
приоритете:

- "Фокусируюсь на v2.0 до 25 апреля" →
  `set_user_focus(focus_text="v2.0", deadline="2026-04-25")`
- "Мои приоритеты — задачи #142, #156, #203" →
  `set_user_focus(focus_text="...", issue_ids=[142, 156, 203])` — сохраняет
  конкретные задачи в нужном порядке
- "Нет, фокус изменился" → повторный `set_user_focus` — это **upsert**, поле
  `action` в ответе `"updated"` vs `"created"`
- Даты из русского текста конвертируются в `YYYY-MM-DD` перед вызовом
- Спринт без даты — сохраняется без дедлайна, агент предлагает добавить
- "Сброси мой фокус" → `clear_user_focus` — удаляет запись и инвалидирует кеш
  памяти

### Запрос фокусных задач

Когда пользователь спрашивает "мои фокусные задачи":

1. Агент вызывает `get_focused_issues`
2. **Web-канал**: создаёт `task_table` артефакт + одно предложение контекста
3. **Telegram-канал**: нумерованный список
   `N. [Название](https://app.shrugged.ai/dashboard/issues/{id})`
4. Нет совпадений → объясняет, показывает critical-задачи
5. Нет фокуса → предлагает задать

### Инструменты агента

| Tool                 | Когда                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| `get_open_issues`    | Список активных задач без фокуса; фильтры по команде, исполнителю, stale_days  |
| `build_daily_plan`   | Рекомендация/дневной план; `scope=personal` или `scope=team`                   |
| `get_tasks`          | Задачи по встрече (`calendar_event_id`) или диапазону дат (`due_before/after`) |
| `set_user_focus`     | Пользователь явно называет приоритет; upsert, поддерживает `issue_ids[]`       |
| `get_focused_issues` | Запрос фокусных задач (3-уровневый fallback)                                   |
| `get_user_focus`     | Только при вопросе о TTL/дедлайне фокуса                                       |
| `clear_user_focus`   | Явный запрос на удаление фокуса                                                |

Фокус автоматически инжектируется в system prompt агента через `MemoryService`
как секция `### Active Focus` — агент видит его без вызова инструментов.
