# Closed Tasks Progress — Где хранятся и отображаются данные

## 1. Хранение данных (база данных)

Все задачи хранятся в таблице **`issues`** (Laravel backend).

Ключевые поля, задействованные в статистике:

| Поле              | Тип      | Назначение                                                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------- |
| `status`          | string   | Статус задачи: `open`, `in_progress`, `paused`, `done`                                |
| `close_date`      | datetime | Заполняется автоматически при переходе в статус `done`, обнуляется при выходе из него |
| `due_date`        | datetime | Дедлайн (используется для подсчёта просроченных)                                      |
| `user_id`         | int      | Владелец задачи                                                                       |
| `organization_id` | int      | Организация (для scope видимости)                                                     |
| `team_id`         | int      | Команда (для scope видимости)                                                         |

**Индекс производительности** (добавлен в рамках этой фичи):

```sql
INDEX tasks_status_close_date_index (status, close_date)
```

Составной индекс устраняет full-scan: фильтр `status = 'done'` отсекает ~80%
строк до сканирования по дате.

**Логика заполнения `close_date`** — модель `Issue.php`, boot-хук:

```php
// app/Models/Issue.php:85
if ($issue->status === 'done') {
    $issue->close_date ??= now();   // ставится при первом переходе в done
} else {
    $issue->close_date = null;      // сбрасывается при откате статуса
}
```

---

## 2. Вычисление статистики (backend)

### Сервис: `app/Services/IssueStatsService.php`

Единственная точка подсчёта статистики по задачам. Работает через scope
`visibleTo($user)`, который учитывает задачи из организаций, команд и личные
задачи пользователя.

#### Метод `getStats()` — текущие показатели

Одним SQL-запросом (`SELECT SUM(boolean)`) считает все 7 полей сразу:

```sql
SELECT
  SUM(close_date >= today_start   AND close_date < tomorrow_start) AS closed_today,
  SUM(close_date >= yesterday_start AND close_date < today_start)  AS closed_yesterday,
  SUM(close_date >= week_start)                                     AS closed_this_week,
  SUM(close_date >= last_week_start AND close_date < week_start)   AS closed_last_week,
  SUM(close_date >= month_start)                                    AS closed_this_month,
  SUM(close_date >= last_month_start AND close_date < month_start) AS closed_last_month,
  COUNT(*)                                                          AS closed_all_time
FROM issues
WHERE status = 'done' AND close_date IS NOT NULL
  AND (organization_id IN (...) OR team_id IN (...) OR user_id = ?)
```

Дельты вычисляются на PHP: `delta_today = closed_today - closed_yesterday` и
т.д.

#### Метод `getHistory()` — история по периодам

Группировка задач по периоду (день / неделя / месяц):

```sql
-- day:   DATE(close_date)
-- week:  DATE(DATE_FORMAT(close_date, '%X-%V-1'))  -- понедельник ISO-недели
-- month: DATE_FORMAT(close_date, '%Y-%m-01')
```

PHP заполняет нули для пропущенных периодов (дней/недель/месяцев без закрытых
задач), чтобы график был непрерывным.

### DTO

| Класс                  | Поля                                                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IssueStatsDTO`        | `closed_today`, `closed_this_week`, `closed_this_month`, `closed_all_time`, `delta_today`, `delta_week`, `delta_month` + базовые `total`, `in_progress`, `completed`, `overdue`, `open`, `paused`, `delta` |
| `IssueStatsHistoryDTO` | `period`, `range`, `items: [{date, closed}]`                                                                                                                                                               |

---

## 3. API-эндпоинты

| Метод | URL                                                 | Auth         | Ответ                  |
| ----- | --------------------------------------------------- | ------------ | ---------------------- |
| `GET` | `/api/v1/issues/stats`                              | Bearer token | `IssueStatsDTO`        |
| `GET` | `/api/v1/issues/stats/history?period=week&range=12` | Bearer token | `IssueStatsHistoryDTO` |

**Параметры history:**

| Параметр | Тип    | Допустимые значения    | По умолчанию                    |
| -------- | ------ | ---------------------- | ------------------------------- |
| `period` | string | `day`, `week`, `month` | — (обязательный)                |
| `range`  | int    | 1–365                  | `day`→30, `week`→12, `month`→12 |

**Контроллер:** `app/Http/Controllers/API/v1/IssueStatsController.php`

---

## 4. Frontend — где отображается

### 4.1. Страница прогресса — `/dashboard/issues/progress`

**Основное место отображения.** Полный дашборд с KPI-карточками и графиком.

```
app/dashboard/issues/(progress)/progress/page.tsx   ← SSR-страница
└── features/issues/ui/issue-progress-page.tsx       ← обёртка
    ├── features/issues/ui/issue-progress-kpi-cards.tsx  ← 4 карточки
    └── features/issues/ui/issue-progress-chart.tsx      ← Recharts-график
```

**Карточки:**

| Карточка          | Поле из API         | Дельта                        |
| ----------------- | ------------------- | ----------------------------- |
| Closed Today      | `closed_today`      | `delta_today` (vs yesterday)  |
| Closed This Week  | `closed_this_week`  | `delta_week` (vs last week)   |
| Closed This Month | `closed_this_month` | `delta_month` (vs last month) |
| All Time          | `closed_all_time`   | —                             |

**График:**

- Данные из `GET /issues/stats/history`
- Переключение периода меняет URL-параметр `?period=` → Server Component
  перерендерит страницу (SSR, без клиентского стейта)
- Текущий незавершённый период отображается с 45% прозрачностью

### 4.2. Сводка дня — `/dashboard/today`

`features/today-briefing/ui/task-stats-block.tsx` — 4 карточки с общей
статистикой задач (total / in_progress / completed / overdue). Использует тот же
`GET /issues/stats`, но показывает другие поля (`total`, `in_progress`,
`completed`, `overdue`).

---

## 5. Слои данных (FSD)

```
features/issues/
├── api/
│   ├── issue-stats.ts          ← Server Action: GET /issues/stats
│   └── issue-stats-history.ts  ← Server Action: GET /issues/stats/history
├── model/
│   └── types.ts                ← IssueStats, IssueStatsHistory, IssueHistoryPeriod
└── ui/
    ├── issue-progress-kpi-cards.tsx
    ├── issue-progress-chart.tsx
    └── issue-progress-page.tsx

shared/ui/stats/
└── delta-badge.tsx             ← Переиспользуемый компонент дельты (↑/↓)

features/today-briefing/api/
└── task-stats.ts               ← re-export из features/issues (обратная совместимость)
```

---

## 6. Scope видимости данных

Пользователь видит только те задачи, к которым у него есть доступ
(`scopeVisibleTo`):

- задачи организаций, в которых он состоит
- задачи команд, в которых он состоит
- личные задачи (без организации и команды, где `user_id = его id`)
