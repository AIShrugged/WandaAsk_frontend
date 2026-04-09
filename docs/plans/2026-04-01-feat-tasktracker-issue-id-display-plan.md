---
title: 'feat: Add Issue ID column, search, and range filter to Tasktracker'
type: feat
status: completed
date: 2026-04-01
---

# feat: Add Issue ID column, search, and range filter to Tasktracker

## Overview

На странице `/dashboard/issues` (вкладка Tasktracker) необходимо:

1. Отображать **ID задачи** как первую колонку таблицы в формате `#42`
2. Поддерживать **поиск по ID**: если пользователь ввёл число — искать по
   точному `id`; иначе — по `name` LIKE
3. Поддерживать **фильтрацию по диапазону ID**: поля «от / до» в панели фильтров
4. Сортировка по ID через заголовок колонки (backend уже поддерживает `sort=id`)

---

## Current State

### Backend (`IssueController@index`)

| Параметр                  | Статус                             |
| ------------------------- | ---------------------------------- |
| `sort=id`                 | ✅ уже работает                    |
| `search` (по `name` LIKE) | ✅ работает, но **только по name** |
| `search` по числовому ID  | ❌ не реализовано                  |
| `id_from` / `id_to` range | ❌ не реализовано                  |

### Frontend (`features/issues/`)

| Элемент                                   | Статус |
| ----------------------------------------- | ------ |
| Колонка `#ID` в таблице                   | ❌ нет |
| `IssueSortField` включает `'id'`          | ❌ нет |
| `IssueFilters` содержит `id_from`/`id_to` | ❌ нет |
| Поиск по числовому значению               | ❌ нет |
| Фильтр-бар: поля диапазона ID             | ❌ нет |

---

## Proposed Solution

### Architecture

```
Backend changes (Laravel):
  IssueRequest.php          — добавить валидацию id_from, id_to (integer, min:1)
  IssueController@index     — поиск по id если search is numeric; WHERE id BETWEEN id_from AND id_to

Frontend changes (Next.js / FSD):
  features/issues/model/types.ts          — расширить IssueFilters, IssueSortField
  features/issues/api/issues.ts           — сериализовать id_from, id_to в query
  features/issues/ui/issues-page.tsx      — добавить колонку #ID, SortableHeader
  features/issues/ui/shared-filters-bar.tsx — добавить поля диапазона ID
```

---

## Backend Changes

### 1. `IssueRequest.php` — добавить правила валидации

```php
// app/Http/Requests/API/v1/IssueRequest.php
// В блоке 'issues.index':
'id_from' => ['nullable', 'integer', 'min:1'],
'id_to'   => ['nullable', 'integer', 'min:1'],
```

Добавить в `getIndexFilters()`:

```php
'id_from' => $this->integer('id_from') ?: null,
'id_to'   => $this->integer('id_to') ?: null,
```

### 2. `IssueController@index` — расширить логику фильтрации

```php
// Поиск: если search — число, ищем по id; иначе по name LIKE
if ($filters['search']) {
    if (ctype_digit($filters['search'])) {
        $query->where('id', (int) $filters['search']);
    } else {
        $query->where('name', 'like', '%' . $filters['search'] . '%');
    }
}

// Диапазон ID
if ($filters['id_from']) {
    $query->where('id', '>=', $filters['id_from']);
}
if ($filters['id_to']) {
    $query->where('id', '<=', $filters['id_to']);
}
```

> **Примечание:** изменение search-логики полностью обратно совместимо — для
> нечислового ввода поведение не меняется.

---

## Frontend Changes

### 1. `features/issues/model/types.ts`

Добавить `'id'` в `IssueSortField` (если там нет):

```typescript
export type IssueSortField =
  | 'id'
  | 'name'
  | 'type'
  | 'status'
  | 'updated_at'
  | 'created_at';
```

Расширить `IssueFilters`:

```typescript
export interface IssueFilters {
  // ... existing fields ...
  id_from?: number | null;
  id_to?: number | null;
}
```

### 2. `features/issues/api/issues.ts` — `buildIssuesQuery()`

```typescript
if (filters.id_from) params.set('id_from', String(filters.id_from));
if (filters.id_to) params.set('id_to', String(filters.id_to));
```

### 3. `features/issues/ui/issues-page.tsx` — таблица

Добавить колонку **ID** первой:

```tsx
// Заголовок
<SortableHeader
  field="id"
  label="ID"
  currentSort={sortField}
  currentOrder={sortOrder}
  onSort={handleSort}
/>

// Ячейка данных
<td className="px-4 py-3 text-sm text-[var(--color-text-muted)] font-mono whitespace-nowrap">
  #{issue.id}
</td>
```

Таблица после изменений:

| #   | Колонка        | Сортируема |
| --- | -------------- | ---------- |
| 1   | **ID** (`#42`) | ✅         |
| 2   | Issue (name)   | ✅         |
| 3   | Type           | ✅         |
| 4   | Status         | ✅         |
| 5   | Scope          | —          |
| 6   | Assignee       | —          |
| 7   | Updated        | ✅         |

### 4. `features/issues/ui/shared-filters-bar.tsx` — панель фильтров

Добавить два числовых поля рядом после существующих фильтров (или до них в
начале):

```tsx
// ID range filter
<div className='flex items-center gap-2'>
  <span className='text-sm text-[var(--color-text-muted)]'>ID</span>
  <input
    type='number'
    min={1}
    placeholder='from'
    value={filters.id_from ?? ''}
    onChange={(e) =>
      onFiltersChange({
        ...filters,
        id_from: e.target.value ? Number(e.target.value) : null,
        offset: 0,
      })
    }
    className='w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm'
  />
  <span className='text-[var(--color-text-muted)]'>—</span>
  <input
    type='number'
    min={1}
    placeholder='to'
    value={filters.id_to ?? ''}
    onChange={(e) =>
      onFiltersChange({
        ...filters,
        id_to: e.target.value ? Number(e.target.value) : null,
        offset: 0,
      })
    }
    className='w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm'
  />
</div>
```

Также убедиться, что `id_from` и `id_to` учитываются при сбросе фильтров (кнопка
«Clear»).

---

## Acceptance Criteria

### Отображение ID

- [ ] Первая колонка таблицы Tasktracker показывает ID задачи в формате `#42`
- [ ] Колонка ID имеет кликабельный заголовок для сортировки (asc/desc)
- [ ] Шрифт ID — `font-mono`, цвет — `text-muted`

### Поиск по ID

- [ ] Ввод числа `42` в строку поиска возвращает только issue с `id = 42`
- [ ] Ввод строки `fix login` ищет по `name` LIKE (поведение не изменилось)
- [ ] Пустой поиск не применяет фильтр

### Фильтр по диапазону

- [ ] Поля «ID from» / «ID to» в панели фильтров принимают числа ≥ 1
- [ ] `id_from=10, id_to=20` возвращает только задачи с ID 10–20 включительно
- [ ] Указание только одного из полей работает корректно (только lower или
      только upper bound)
- [ ] Кнопка сброса фильтров очищает поля диапазона

### Сортировка

- [ ] Клик по заголовку ID сортирует по возрастанию → повторный клик — по
      убыванию
- [ ] Параметры `sort=id&order=asc/desc` передаются в API

### Обратная совместимость

- [ ] Существующие фильтры (status, type, assignee, org, team, search по name)
      работают без изменений
- [ ] Бесконечная прокрутка (infinite scroll) работает вместе с фильтром по
      диапазону

---

## Edge Cases

| Случай                               | Ожидаемое поведение                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `id_from > id_to`                    | Можно показать 0 результатов (backend отфильтрует); желательно валидировать на frontend                                       |
| `search = "0"` / `search = "abc123"` | `"0"` → числовой, ищет `id=0` (нет результатов); `"abc123"` → нечисловой, LIKE                                                |
| `search = "42"` + `id_from = 10`     | Оба фильтра применяются одновременно (AND)                                                                                    |
| Очень большое число в поле ID        | Backend: `integer` validation; frontend: `max` можно не ставить                                                               |
| Kanban board                         | Фильтры `id_from`/`id_to` — только в Tasktracker tab; SharedFiltersBar должна их скрывать или KanbanBoard должна игнорировать |

---

## Files to Change

### Backend (`/Users/slavapopov/Documents/WandaAsk_backend`)

```
app/Http/Requests/API/v1/IssueRequest.php   — добавить id_from, id_to валидацию + getIndexFilters()
app/Http/Controllers/API/v1/IssueController.php — расширить search + добавить id range WHERE
```

### Frontend (`/Users/slavapopov/Documents/WandaAsk_frontend`)

```
features/issues/model/types.ts              — IssueFilters + IssueSortField
features/issues/api/issues.ts               — buildIssuesQuery serialization
features/issues/ui/issues-page.tsx          — колонка #ID + SortableHeader
features/issues/ui/shared-filters-bar.tsx   — поля ID range
```

---

## Implementation Notes

- **Kanban board**: `SharedFiltersBar` используется и в Tasktracker, и в Kanban.
  Поля `id_from`/`id_to` имеют смысл только для Tasktracker. Вариант —
  передавать проп `showIdRange?: boolean` в `SharedFiltersBar` и рендерить поля
  только когда `true`. Kanban API не принимает эти параметры и безопасно их
  проигнорирует, но лучше не захламлять Kanban UI лишними контролами.
- **API layer**: `features/issues/api/issues.ts` использует raw `fetch` вместо
  `httpClient` (нарушение Rule 2). В рамках этой задачи можно не рефакторить, но
  стоит зафиксировать как tech debt.
- **Numeric search detection**: На backend используем `ctype_digit()` —
  безопаснее чем `is_numeric()` (не пропускает float/hex). На frontend
  дополнительная логика не нужна — просто передаём `search` как есть.
- **`id_from` validation**: На frontend можно добавить проверку
  `id_from <= id_to` перед отправкой запроса для лучшего UX.

---

## References

- `features/issues/model/types.ts` — IssueFilters, IssueSortField, Issue
  interface
- `features/issues/api/issues.ts` — buildIssuesQuery(), getIssues()
- `features/issues/ui/issues-page.tsx:325-364` — table headers и rows
- `features/issues/ui/shared-filters-bar.tsx` — SharedFiltersBar компонент
- `shared/ui/table/SortableHeader.tsx` — переиспользуемый sortable header
- `WandaAsk_backend/app/Http/Controllers/API/v1/IssueController.php:23-63` —
  index()
- `WandaAsk_backend/app/Http/Requests/API/v1/IssueRequest.php:20-31` —
  validation rules
