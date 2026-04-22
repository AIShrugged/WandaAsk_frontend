---
title: refactor: Universal DateNavigator shared component
type: refactor
status: completed
date: 2026-04-22
---

# refactor: Universal DateNavigator — единый переиспользуемый компонент навигации по датам

## Overview

Два компонента выполняют одну задачу — навигацию по датам — но реализованы
по-разному и с дублирующейся логикой:

- `features/today-briefing/ui/day-navigator.tsx` — компонент страницы Today
  Briefing
- `features/meetings/ui/date-switcher.tsx` — компонент страниц списка и колонок
  встреч

**Цель:** вынести общий компонент в `shared/ui/navigation/`, сделать
`DayNavigator` и `DateSwitcher` тонкими обёртками над ним, а всю вспомогательную
логику переместить в `shared/lib/`.

---

## Problem Statement

| Проблема                                        | Место                                                | Последствие                                             |
| ----------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Дублирование логики навигации                   | Оба компонента                                       | DRY нарушен                                             |
| Ручной рендер `YYYY-MM-DD` в `DateSwitcher`     | `date-switcher.tsx:17–23`                            | Ошибки TZ, когда есть `date-fns`                        |
| Кнопки без единого стиля                        | `DayNavigator` — стилизованные, `DateSwitcher` — нет | Визуальная несогласованность                            |
| `DateSwitcher` не сохраняет другие query-params | Нет, сохраняет. `DayNavigator` — не сохраняет        | Баг: при навигации в briefing теряются другие параметры |
| Нет переиспользования в других фичах            | —                                                    | Kanban, Issues, Debug Logs вынуждены писать своё        |

---

## Proposed Solution

### Архитектура после рефакторинга

```
shared/
  lib/
    date-nav.ts              # утилиты: toDateParam, formatDateLabel, formatDateLong
  ui/
    navigation/
      date-navigator.tsx     # ← новый universal shared component
      index.ts               # экспорт DateNavigator
features/
  meetings/
    ui/
      date-switcher.tsx      # ← тонкая обёртка над DateNavigator (большой заголовок)
  today-briefing/
    ui/
      day-navigator.tsx      # ← тонкая обёртка над DateNavigator (с бейджем и Back Today)
```

---

## Technical Approach

### Step 1 — Утилиты в `shared/lib/date-nav.ts`

Создать файл `shared/lib/date-nav.ts` с тремя чистыми функциями (zero-deps кроме
`date-fns`):

```ts
// shared/lib/date-nav.ts
import {
  addDays,
  format,
  isToday,
  isYesterday,
  isTomorrow,
  parseISO,
} from 'date-fns';

/** YYYY-MM-DD → Date (timezone-safe) */
export function parseDateParam(dateStr: string): Date {
  return parseISO(dateStr);
}

/** Date → YYYY-MM-DD строка для query-param */
export function toDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Date → сдвинуть на offset дней → YYYY-MM-DD */
export function shiftDate(date: Date, offset: number): string {
  return toDateParam(addDays(date, offset));
}

/** Относительный лейбл: "Today" / "Yesterday" / "Tomorrow" / "Apr 22" */
export function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Длинный формат: "Tuesday, April 22" */
export function formatDateLong(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}
```

**Принципы:**

- Все функции — чистые (pure), без side-effects
- `parseISO` из `date-fns` вместо `new Date(str + 'T00:00:00')` — безопасно для
  TZ
- Используется `date-fns` для единообразия (уже является зависимостью)

---

### Step 2 — Хук `useDateNavigation` в `shared/ui/navigation/`

Вся логика навигации через `useRouter` / `useSearchParams` инкапсулируется в
один хук:

```ts
// shared/ui/navigation/use-date-navigation.ts
'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { parseDateParam, shiftDate, toDateParam } from '@/shared/lib/date-nav';

interface UseDateNavigationOptions {
  /** Если true — сохраняет все остальные search params (как DateSwitcher) */
  preserveParams?: boolean;
  /** Если true — использует pathname + ?date= (как DayNavigator) */
  usePathname?: boolean;
}

export function useDateNavigation(
  dateStr: string,
  options: UseDateNavigationOptions = {},
) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const current = parseDateParam(dateStr);

  const navigate = (offset: number) => {
    const newDateStr = shiftDate(current, offset);

    if (options.preserveParams) {
      const next = new URLSearchParams(params);
      next.set('date', newDateStr);
      router.push(`?${next.toString()}`, { scroll: false });
    } else {
      router.push(`${pathname}?date=${newDateStr}`, { scroll: false });
    }
  };

  const goToday = () => {
    if (options.preserveParams) {
      const next = new URLSearchParams(params);
      next.delete('date');
      router.push(`?${next.toString()}`, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  };

  return { current, navigate, goToday };
}
```

---

### Step 3 — Универсальный компонент `DateNavigator` в `shared/ui/navigation/`

Компонент поддерживает два визуальных режима через пропс `variant`:

```ts
// shared/ui/navigation/date-navigator.tsx
'use client';

interface DateNavigatorProps {
  /** YYYY-MM-DD дата */
  date: string;
  /**
   * 'compact'   — маленькие стилизованные кнопки + длинный формат даты (DayNavigator стиль)
   * 'prominent' — прозрачные кнопки + H2 заголовок с relative labels (DateSwitcher стиль)
   */
  variant?: 'compact' | 'prominent';
  /** Показывать кнопку «Back Today» когда дата ≠ сегодня */
  showBackToday?: boolean;
  /** Дополнительный контент справа от даты (бейдж с числом встреч и т.п.) */
  badge?: ReactNode;
  /** Сохранять ли другие search params при навигации */
  preserveParams?: boolean;
  className?: string;
}
```

**Внутренняя структура — декомпозиция на подкомпоненты:**

```
DateNavigator (оркестратор)
├── NavButton          (кнопка со стрелкой — компактная или прозрачная)
├── DateLabel          (лейбл даты — span или H2 в зависимости от variant)
└── BackTodayButton    (кнопка "Back Today" — показывается только при showBackToday)
```

Каждый подкомпонент — отдельная функция внутри того же файла (не отдельные
файлы, т.к. они не используются самостоятельно нигде):

```tsx
// NavButton — два стиля через variant
function NavButton({ onClick, icon: Icon, variant }: NavButtonProps) {
  if (variant === 'prominent') {
    return (
      <button type='button' className='cursor-pointer' onClick={onClick}>
        <Icon />
      </button>
    );
  }
  return (
    <button
      type='button'
      className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors'
      onClick={onClick}
    >
      <Icon className='h-4 w-4' />
    </button>
  );
}

// DateLabel — span или H2
function DateLabel({ date, variant }: DateLabelProps) {
  if (variant === 'prominent') {
    return <H2>{formatDateLabel(date)}</H2>;
  }
  return (
    <span className='text-sm font-medium text-foreground min-w-[160px] text-center'>
      {formatDateLong(date)}
    </span>
  );
}

// BackTodayButton
function BackTodayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='ml-1 rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors'
    >
      Back Today
    </button>
  );
}
```

---

### Step 4 — Обновление `DayNavigator` (тонкая обёртка)

```tsx
// features/today-briefing/ui/day-navigator.tsx
'use client';

import { isToday } from 'date-fns';
import { DateNavigator } from '@/shared/ui/navigation/date-navigator';

interface DayNavigatorProps {
  date: string;
  meetingsCount: number;
}

export function DayNavigator({ date, meetingsCount }: DayNavigatorProps) {
  const badge =
    meetingsCount > 0 ? (
      <span className='text-xs text-muted-foreground'>
        {meetingsCount} {meetingsCount === 1 ? 'meeting' : 'meetings'}
      </span>
    ) : null;

  return (
    <DateNavigator date={date} variant='compact' showBackToday badge={badge} />
  );
}
```

### Step 5 — Обновление `DateSwitcher` (тонкая обёртка)

```tsx
// features/meetings/ui/date-switcher.tsx
'use client';

import { DateNavigator } from '@/shared/ui/navigation/date-navigator';

interface DateSwitcherProps {
  selectedDate: string;
}

export function DateSwitcher({ selectedDate }: DateSwitcherProps) {
  return (
    <DateNavigator date={selectedDate} variant='prominent' preserveParams />
  );
}
```

---

## Acceptance Criteria

### Функциональные

- [ ] `DayNavigator` визуально совпадает с текущим видом (кнопки 8×8, border,
      bg-card)
- [ ] `DateSwitcher` визуально совпадает с текущим видом (H2, relative labels,
      прозрачные кнопки)
- [ ] Навигация вперёд/назад работает корректно в обоих компонентах
- [ ] `DateSwitcher` сохраняет все query-params при навигации
      (`preserveParams=true`)
- [ ] `DayNavigator` показывает кнопку «Back Today» только когда дата ≠ сегодня
- [ ] «Back Today» возвращает на текущий день (удаляет `?date=` param)
- [ ] Бейдж с числом встреч отображается только при `meetingsCount > 0`
- [ ] Все существующие страницы (today briefing, meetings list, meetings
      columns) работают без регрессий

### Технические

- [ ] `shared/lib/date-nav.ts` содержит только чистые функции без side-effects
- [ ] `DateNavigator` не импортирует ничего из `features/` или `entities/`
- [ ] `DayNavigator` и `DateSwitcher` остаются в своих feature-папках, не
      переезжают
- [ ] `shared/ui/navigation/index.ts` экспортирует `DateNavigator`
- [ ] Нет нарушений FSD границ
- [ ] TypeScript `strict: true` — нет `any`
- [ ] ESLint и Prettier — без ошибок

### Качество

- [ ] Нет дублирования логики `toDateParam` / `formatDateLabel` /
      `parseDateParam`
- [ ] `date-fns` используется вместо ручного `new Date(str + 'T00:00:00')` и
      `setDate`
- [ ] Подкомпоненты `NavButton`, `DateLabel`, `BackTodayButton` выделены внутри
      файла

---

## File List

| Файл                                           | Действие                    |
| ---------------------------------------------- | --------------------------- |
| `shared/lib/date-nav.ts`                       | СОЗДАТЬ                     |
| `shared/ui/navigation/date-navigator.tsx`      | СОЗДАТЬ                     |
| `shared/ui/navigation/use-date-navigation.ts`  | СОЗДАТЬ                     |
| `shared/ui/navigation/index.ts`                | ОБНОВИТЬ (добавить экспорт) |
| `features/today-briefing/ui/day-navigator.tsx` | ОБНОВИТЬ (тонкая обёртка)   |
| `features/meetings/ui/date-switcher.tsx`       | ОБНОВИТЬ (тонкая обёртка)   |

---

## Implementation Order

```
1. shared/lib/date-nav.ts          (нет зависимостей от проекта)
2. shared/ui/navigation/use-date-navigation.ts  (зависит от date-nav.ts)
3. shared/ui/navigation/date-navigator.tsx      (зависит от use-date-navigation.ts)
4. shared/ui/navigation/index.ts   (добавить экспорт)
5. features/today-briefing/ui/day-navigator.tsx (зависит от DateNavigator)
6. features/meetings/ui/date-switcher.tsx       (зависит от DateNavigator)
7. Запустить lint + fsd-boundary-guard + визуальная проверка
```

---

## Dependencies & Risks

| Риск                                                    | Вероятность          | Митигация                                           |
| ------------------------------------------------------- | -------------------- | --------------------------------------------------- |
| Регрессия в `meetings-column-view.tsx`                  | Низкая               | Тест вручную + E2E                                  |
| TZ-баг при замене ручного `new Date(str)` на `parseISO` | Низкая               | `parseISO` обрабатывает `YYYY-MM-DD` как local time |
| Нарушение FSD при импорте в `shared/`                   | Нет (если соблюдать) | `fsd-boundary-guard` после рефакторинга             |
| `useSearchParams` требует `Suspense` в Next.js          | Есть                 | Проверить, обёрнуты ли страницы в `Suspense`        |

### Важно: `useSearchParams` + Suspense

В Next.js App Router `useSearchParams()` в клиентском компоненте требует наличия
`<Suspense>` в дереве выше. Это уже работает в `DateSwitcher` (раньше работало
без проблем), значит `Suspense` уже есть в цепочке. При необходимости добавить
`Suspense`-обёртку в `DateNavigator`:

```tsx
// Если возникнет предупреждение о Suspense:
export function DateNavigator(props: DateNavigatorProps) {
  return (
    <Suspense fallback={<DateNavigatorSkeleton />}>
      <DateNavigatorInner {...props} />
    </Suspense>
  );
}
```

---

## Future Extensibility

Когда другие фичи (Kanban, Issues, Debug Logs) захотят добавить навигацию по
дате — достаточно использовать
`<DateNavigator date={...} variant='compact' preserveParams />`. Никакого
дублирования.

---

## References

### Internal

- `features/today-briefing/ui/day-navigator.tsx` — текущая реализация
- `features/meetings/ui/date-switcher.tsx` — текущая реализация
- `shared/ui/navigation/page-tabs-nav.tsx` — пример существующего навигационного
  компонента в shared
- `shared/ui/typography/H2.tsx` — используется в `prominent` variant
- `shared/lib/dateFormatter.ts` — существующие утилиты дат (не менять,
  дополнять)

### Usages to Verify After Refactor

- `features/meetings/ui/meetings-day-view.tsx:5,21` — импортирует DateSwitcher
- `features/meetings/ui/meetings-column-view.tsx:5,78` — импортирует
  DateSwitcher
- `app/dashboard/today/meetings/meetings-content.tsx:6,37` — импортирует
  DayNavigator
