---
title: Frontend Quality Improvements
type: refactor
status: completed
date: 2026-03-13
---

# Frontend Quality Improvements

## Enhancement Summary

**Deepened on:** 2026-03-13 **Research agents:** TypeScript reviewer,
Performance oracle, Architecture strategist, Code simplicity reviewer, Race
conditions reviewer, Unit test booster, Design guardian, Best practices
researcher, FSD boundary guard, Performance auditor

### Critical Bugs Discovered (не было в исходном плане)

1. **`mountedRef.current` не сбрасывается в `artifact-panel.tsx`** — после смены
   `chatId` панель навсегда показывает стейл-данные
2. **5 recharts-компонентов** импортируются в Server Component без `ssr: false`
   — recharts использует браузерные API (`window.ResizeObserver`)
3. **`DemoSeedButton`** импортируется статически в layout каждой
   dashboard-страницы — polling/portal overhead на каждой странице

### Major Revisions to Original Plan

- Phase 2 (Loading states): **auth-страницы убраны** (нет серверных данных);
  добавлен `aria-busy`; паттерн для auth — без Card-обёртки
- Phase 3 (Empty states): перемещён в `shared/ui/feedback/`; `action` prop убран
  (YAGNI); заголовок `text-foreground`, не `text-muted`
- Phase 4 (Chart colors): переименован в `CHART_PALETTE` (коллизия с
  существующим); экспортировать только 3 структурных константы; добавить
  `cursor` prop для Tooltip
- Phase 5 (Тесты): **большинство компонентов уже имеют тесты**; единственный
  реальный gap — `Card.tsx`
- Phase 6 (Рефакторинг): НЕ создавать `artifact-renderer/` (уже есть
  `artifacts/`); demo-split минимальный
- FSD violations: найдено **14 нарушений** (не 2)

---

## Phase 0 — Критические баги (исправить ПЕРВЫМИ)

### 0.1 `mountedRef.current` не сбрасывается — artifact-panel.tsx

**Файл:** `features/chat/ui/artifact-panel.tsx`

**Баг:** `mountedRef` инициализируется как `useRef(true)`. В cleanup-функции
эффекта: `mountedRef.current = false`. При смене `chatId` React запускает
cleanup (→ `false`), затем перезапускает эффект — но `mountedRef.current` так и
остаётся `false`. Все `setArtifacts` заблокированы. Панель показывает
стейл-данные от предыдущего чата навсегда.

**Фикс:** В начале тела эффекта добавить `mountedRef.current = true`.

### 0.2 `app/dashboard/summary/page.tsx` — recharts без `ssr: false`

**Файл:** `app/dashboard/summary/page.tsx`

**Баг:** Страница — Server Component. Напрямую импортирует 5
recharts-компонентов. Recharts вызывает `window.ResizeObserver` при
инициализации — это упадёт при SSR.

**Фикс:** Обернуть каждый в `next/dynamic(..., { ssr: false })`.

```tsx
// Было (в app/dashboard/summary/page.tsx):
import { MeetingStats } from '@/features/summary/ui/MeetingStats';

// Стало:
const MeetingStats = dynamic(
  () =>
    import('@/features/summary/ui/MeetingStats').then((m) => ({
      default: m.MeetingStats,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className='h-48 rounded-xl' />,
  },
);
```

Применить для: `MeetingStats`, `TaskStats`, `FollowupStats`, `ParticipantStats`,
`TeamStats`.

### 0.3 `DemoSeedButton` в dashboard layout

**Файл:** `app/dashboard/layout.tsx`

**Баг:** `DemoSeedButton` — `'use client'` компонент с polling, Portal, sonner,
Server Actions, 3 lucide-иконами. Импортируется статически в layout каждой
dashboard-страницы.

**Фикс:**

```tsx
const DemoSeedButton = dynamic(
  () => import('@/features/demo/ui/demo-seed-button'),
  {
    ssr: false,
    loading: () => null,
  },
);
```

### 0.4 FSD-нарушения (14 найдено)

FSD boundary guard обнаружил 14 нарушений. Первоочерёдные:

**Cross-feature imports (5):**

- `features/calendar/ui/event.tsx` → `features/event/ui/`,
  `features/participants/api/`
- `features/event/ui/event-popup.tsx` → `features/participants/lib/`,
  `features/participants/ui/`
- `features/dashboard/api/dashboard.ts` → `features/chat/api/chats`,
  `features/methodology/api/`, `features/teams/api/`, `features/user/api/`
- `features/dashboard/ui/RecentChats.tsx` → `features/chat/types` (минуя index)

**Глубокие импорты из app/ (7):** Несколько `app/` страниц импортируют из
внутренних путей feature вместо публичного `index.ts`.

**Отсутствующие `index.ts` (5 фич):** `demo`, `summary`, `dashboard`, `landing`,
`user-profile`.

**Бизнес-логика в app/ (1):** `KpiCard` компонент определён инлайн в
`app/dashboard/summary/page.tsx` — должен быть в `features/summary/ui/`.

> ⚠️ Исправляйте Phase 0 перед Phase 6 — рефакторинг затронет эти же файлы.

---

## Phase 1 — CSS-фиксы (30 мин)

### 1.1 `var(--text-tertiary)` → `bg-border`

**Файл:** `features/chat/ui/chat-window.tsx`

`--text-tertiary` отсутствует в globals.css.

```tsx
// было
<div className='bg-[var(--text-tertiary)] ...' />
// стало
<div className='bg-border ...' />
```

### 1.2 `text-primary-600` → `text-primary`

**Файл:** `features/menu/ui/menu-nested-item.tsx`

В дизайн-системе нет шкалы `primary-600`.

### 1.3 Recharts Tooltip — белый на тёмном фоне (ВИЗУАЛЬНЫЙ БАГ)

**Файлы:** `features/summary/ui/MeetingStats.tsx`, `TaskStats.tsx`,
`FollowupStats.tsx`, `ParticipantStats.tsx`, `TeamStats.tsx`

Текущие `TOOLTIP_STYLE` используют `background: 'hsl(0 0% 100%)'` (белый) — это
светлые значения в тёмной теме. Tooltip выглядит как яркий белый прямоугольник.

**Фикс:** Исправить сразу здесь, до Phase 4.

---

## Phase 2 — Loading States

> **Research insight:** Auth-страницы (login, register, org) — Client Components
> с react-hook-form, нет серверных данных. `loading.tsx` создаст ненужный флэш.
> **Не добавлять на auth-страницы.**

Добавить `loading.tsx` только для dashboard-маршрутов (11 файлов, было 16).

### Паттерн A — SkeletonList (страницы-списки)

```tsx
import Card from '@/shared/ui/card/Card';
import { SkeletonList } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading content'>
      {/* aria-busy обязателен для accessibility */}
      <Card className='h-full flex flex-col'>
        <SkeletonList rows={6} />
      </Card>
    </div>
  );
}
```

### Паттерн B — SpinLoader (формы создания)

> **Design insight:** SpinLoader — fallback последнего resort. Используем ТОЛЬКО
> для форм создания где нет структуры для preview.

```tsx
import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

export default function Loading() {
  return (
    <Card className='h-full flex flex-col items-center justify-center'>
      <SpinLoader />
    </Card>
  );
}
```

### Паттерн C — Custom Skeleton (сложные страницы)

> **Design insight:** `rounded-xl` (12px) вне дизайн-системы. Использовать
> `rounded-[var(--radius-card)]` (8px).

```tsx
import Card from '@/shared/ui/card/Card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading content'>
      <Card className='h-full flex flex-col gap-4 p-6'>
        <Skeleton className='h-6 w-48' />
        <div className='grid grid-cols-2 gap-4'>
          <Skeleton className='h-32 rounded-[var(--radius-card)]' />
          <Skeleton className='h-32 rounded-[var(--radius-card)]' />
        </div>
        <Skeleton className='h-64 rounded-[var(--radius-card)]' />
      </Card>
    </div>
  );
}
```

### Матрица страниц → паттерн

| Файл                                                 | Паттерн          | Обоснование                             |
| ---------------------------------------------------- | ---------------- | --------------------------------------- |
| `app/dashboard/chat/loading.tsx`                     | A — SkeletonList | список чатов                            |
| `app/dashboard/teams/[id]/loading.tsx`               | A — SkeletonList | список участников                       |
| `app/dashboard/teams/create/loading.tsx`             | B — SpinLoader   | форма создания                          |
| `app/dashboard/methodology/[id]/loading.tsx`         | A — SkeletonList | детали методологии                      |
| `app/dashboard/methodology/create/loading.tsx`       | B — SpinLoader   | форма создания                          |
| `app/dashboard/meeting/[id]/loading.tsx`             | C — Custom       | митинг со статистикой                   |
| `app/dashboard/follow-ups/[id]/loading.tsx`          | A — SkeletonList | проверить структуру строк перед выбором |
| `app/dashboard/follow-ups/analysis/[id]/loading.tsx` | C — Custom       | анализ с графиками                      |
| `app/dashboard/organization/[id]/loading.tsx`        | A — SkeletonList | детали организации                      |
| `app/dashboard/organization/create/loading.tsx`      | B — SpinLoader   | форма создания                          |
| `app/email-verified/loading.tsx`                     | B — SpinLoader   | статусная страница                      |

> Auth-страницы (`login`, `register`, `auth/organization`,
> `auth/organization/create`, `invite-accepted`) — **пропустить**.

> **Tip для follow-ups:** Проверить реальную структуру строк. `SkeletonList`
> показывает avatar-circle слева. Если follow-up строки не имеют аватара —
> использовать custom skeleton без круглого элемента.

---

## Phase 3 — Empty States

### 3.1 Создать `shared/ui/feedback/empty-state.tsx`

> **Architecture insight:** `layout/` — структурные/chrome компоненты.
> EmptyState — feedback-компонент. Правильное место: `shared/ui/feedback/`
> (новый subdirectory, как `shared/ui/error/` для `ErrorDisplay`).

> **Simplicity insight:** `action` prop — YAGNI. Ни одного текущего callsite с
> CTA-кнопкой в EmptyState. Убрать.

> **TypeScript insight:** `import type { LucideIcon }` — точнее чем
> `React.ComponentType`.

```tsx
// shared/ui/feedback/empty-state.tsx
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      role='status'
      aria-live='polite' // только для динамически появляющихся empty states
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center gap-3',
        className,
      )}
    >
      {Icon && (
        <Icon
          className='h-8 w-8 text-muted-foreground opacity-50'
          aria-hidden='true'
        />
      )}
      {/* title: text-foreground (не muted) — создаёт иерархию: icon→title→description */}
      <p className='text-sm font-medium text-foreground'>{title}</p>
      {description && (
        <p className='text-xs text-muted-foreground/70'>{description}</p>
      )}
    </div>
  );
}
```

> **Design insight:** Обернуть в существующий `Opacity` компонент (из
> `shared/ui/animation/`) для fade-in входа. Статичная анимация после mount — не
> looping.

### 3.2 Где применить

| Компонент        | Иконка          | Заголовок                |
| ---------------- | --------------- | ------------------------ |
| Follow-ups list  | `ClipboardList` | `"No follow-ups yet"`    |
| Teams list       | `Users`         | `"No teams yet"`         |
| Methodology list | `BookOpen`      | `"No methodologies yet"` |

> Teams — единственный где в будущем нужен CTA ("Create team"). Добавить
> `action` prop когда появится конкретный callsite.

---

## Phase 4 — Hardcoded цвета в chart-компонентах

### Проблема

Recharts не читает CSS-переменные в `fill`/`stroke`. Текущие `TOOLTIP_STYLE`
используют **светлые значения** в тёмной теме — визуальный баг.

> **Naming conflict:** `CHART_COLORS` уже существует как `readonly string[]` в
> `features/chat/ui/artifacts/chart-artifact.tsx` (для циклического перебора
> цветов). Новый объект с named keys должен называться по-другому.

> **Simplicity insight:** Экспортировать только 3 структурных константы,
> продублированных verbatim в 4+ файлах. Цвета баров/линий — семантически разные
> в каждом чарте, оставить локальными.

### Создать `shared/lib/chart-theme.ts`

```ts
// shared/lib/chart-theme.ts
// ⚠️ Значения синхронизированы с app/globals.css — менять только вместе

// Tooltip с тёмной темой (было: белый фон — визуальный баг)
export const CHART_TOOLTIP_STYLE = {
  background: 'hsl(240 30% 7%)', // --card
  border: '1px solid hsl(240 15% 16%)', // --border
  borderRadius: '6px',
  fontSize: 12,
  color: 'hsl(220 20% 93%)', // --foreground
} as const;

export const CHART_TICK_STYLE = {
  fontSize: 11,
  fill: 'hsl(240 8% 56%)', // --muted-foreground
} as const;

export const CHART_GRID_COLOR = 'hsl(240 15% 16%)'; // --border

// Cursor при hover на барах (было: белый прямоугольник)
export const CHART_CURSOR_STYLE = {
  fill: 'hsl(240 20% 13%)', // --secondary
  opacity: 0.6,
} as const;
```

> **Note:** Цвета баров (`BAR_COLOR`, `STATUS_COLORS`) — семантически разные в
> каждом чарте. Оставить локальными в каждом файле.

### Обновить Tooltip cursor во всех чартах

```tsx
// Было:
<Tooltip contentStyle={CHART_TOOLTIP_STYLE} />

// Стало (для BarChart):
<Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_CURSOR_STYLE} />
// Для LineChart:
<Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: 'hsl(240 15% 16%)', strokeWidth: 1 }} />
```

### Файлы для обновления

| Файл                                       | Что менять                                                          |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `features/summary/ui/MeetingStats.tsx`     | `TOOLTIP_STYLE`, `TICK_STYLE`, `GRID_COLOR` → из chart-theme        |
| `features/summary/ui/TaskStats.tsx`        | `TOOLTIP_STYLE`, `TICK_STYLE`, `GRID_COLOR` → из chart-theme        |
| `features/summary/ui/FollowupStats.tsx`    | То же                                                               |
| `features/summary/ui/ParticipantStats.tsx` | То же                                                               |
| `features/summary/ui/TeamStats.tsx`        | То же                                                               |
| `features/analysis/ui/chart-donut.tsx`     | `stroke='#e0fad8'`, `stroke='#4FB268'` → CSS-токены или chart-theme |
| `app/dashboard/statistics/` (a, b, c)      | hardcoded `fill='#4FB268'`                                          |

---

## Phase 5 — Тесты

> **Unit test booster discovery:** Большинство из 8 компонентов **уже имеют
> тесты**. Реальных gap значительно меньше.

### Реальные gap'ы

#### 5.1 `shared/ui/card/Card.tsx` — ЕДИНСТВЕННЫЙ РЕАЛЬНЫЙ ПРОБЕЛ

Никакого `Card.test.tsx` нет. `CardBody.test.tsx` — это другой компонент.

```tsx
// shared/ui/card/__tests__/Card.test.tsx
// Моки не нужны — pure structural component
describe('Card', () => {
  it('renders children');
  it('renders as a div element');
  it('merges custom className with defaults');
  it('renders without className (no crash)');
});
```

> **Gotcha:** Не assertить конкретные Tailwind CSS variable токены типа
> `rounded-[var(--radius-card)]` — jsdom их не вычисляет. Assertить только
> наличие переданного `className`.

#### 5.2 Уже покрытые компоненты (НЕ писать заново)

| Компонент                    | Статус                                             |
| ---------------------------- | -------------------------------------------------- |
| `WandaLogo.tsx`              | Покрыт через `TribesLogo.test.tsx` ✓               |
| `cosmic-background.tsx`      | 3 теста + `aria-hidden` ✓                          |
| `infinite-scroll-status.tsx` | 3 теста (pure display, нет IntersectionObserver) ✓ |
| `button-copy.tsx`            | 4 теста ✓                                          |
| `button-close.tsx`           | 3 теста ✓                                          |
| `button-back.tsx`            | 3 теста ✓                                          |
| `button-icon.tsx`            | 6 тестов ✓                                         |

#### 5.3 Опциональные улучшения существующих тестов

- `button-close.test.tsx` — добавить тест для `size` prop (smoke)
- `button-icon.test.tsx` — добавить smoke для `variant="danger"`

#### 5.4 Тест для нового `EmptyState` (из Phase 3)

```tsx
// shared/ui/feedback/__tests__/EmptyState.test.tsx
describe('EmptyState', () => {
  it('renders title');
  it('renders icon when provided');
  it('renders description when provided');
  it('works with title-only');
  it('has role=status for accessibility');
  it('icon has aria-hidden=true');
});
```

---

## Phase 6 — Рефакторинг больших компонентов

### 6.1 `features/demo/ui/demo-seed-button.tsx` (459 строк) — минимальный split

> **Code simplicity:** dev-only компонент. Сложный рефакторинг не оправдан.
> **Architecture:** Static constants (`TEAMS_COUNT_OPTIONS`, etc.) — это
> `fixtures/`, не `model/`. **FSD:** Нужен `features/demo/index.ts`
> (отсутствует) — это реальная проблема.

**Что сделать:**

1. Создать `features/demo/index.ts` — экспортировать `DemoSeedButton`
2. Обновить импорт в `app/dashboard/layout.tsx`:
   `@/features/demo/ui/demo-seed-button` → `@/features/demo`
3. Вынести константы в `features/demo/lib/seed-config.ts` (необязательно, только
   если файл станет >500 строк)

> `SegmentedControl` и `Stepper` — generic UI-контролы. Оценить перемещение в
> `shared/ui/input/` если нужны в других местах.

### 6.2 `features/landing/ui/LandingHero.tsx` (359 строк) — private sub-components

```tsx
// features/landing/ui/LandingHero.tsx — private sub-components в одном файле

function HeroHeadline() { ... }    // ~40 строк
function HeroActions() { ... }     // ~30 строк
function HeroDemo() { ... }        // ~60 строк
function HeroStats() { ... }       // ~40 строк

export function LandingHero() {
  return (
    <section>
      <HeroHeadline />
      <HeroActions />
      <HeroDemo />
      <HeroStats />
    </section>
  );
}
```

> React Compiler (Next.js 16) автоматически мемоизирует — ручной `React.memo()`
> не нужен.

> Создать `features/landing/index.ts` (сейчас отсутствует).

### 6.3 `features/chat/ui/artifact-panel.tsx` (326 строк) — исправить `mountedRef` и расширить `artifacts/`

> **Code simplicity:** НЕ создавать `artifact-renderer/` — рендереры уже
> существуют в `features/chat/ui/artifacts/`.

**Что сделать:**

1. **Исправить mountedRef баг** (Phase 0.1) — `mountedRef.current = true` в
   начале эффекта
2. Вынести `ArtifactCard` и `ArtifactContent` в
   `features/chat/ui/artifacts/artifact-card.tsx` и `artifact-content.tsx`
3. `artifact-panel.tsx` становится тонкой shell (~60 строк): polling + layout
4. Обернуть `ChartArtifactView` в `dynamic()` (recharts ~120KB):

```tsx
// В artifact-panel.tsx или artifact-content.tsx:
const ChartArtifactView = dynamic(
  () =>
    import('./artifacts/chart-artifact').then((m) => ({
      default: m.ChartArtifactView,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className='h-48 rounded-[var(--radius-card)]' />,
  },
);
```

5. Исправить `TYPE_META` — переместить JSX иконки из module-level константы
   внутрь render (JSX при module parse == eager allocation)

---

## Acceptance Criteria

### Phase 0 — Критические баги

- [ ] `mountedRef.current = true` добавлен в начало эффекта в
      `artifact-panel.tsx`
- [ ] 5 recharts компонентов обёрнуты в `dynamic({ ssr: false })` в
      `summary/page.tsx`
- [ ] `DemoSeedButton` — `dynamic({ ssr: false })` в `dashboard/layout.tsx`
- [ ] Минимум: добавлены `index.ts` для `features/demo` и `features/summary`
- [ ] Инлайн `KpiCard` перемещён в `features/summary/ui/`

### Phase 1 — CSS-фиксы

- [ ] `var(--text-tertiary)` → `bg-border`
- [ ] `text-primary-600` → `text-primary`
- [ ] Recharts `TOOLTIP_STYLE` исправлен (тёмные цвета)

### Phase 2 — Loading States (11 файлов, не auth-страницы)

- [ ] 11 новых `loading.tsx` файлов созданы
- [ ] Все содержат `aria-busy="true"` wrapper
- [ ] Custom skeletons используют `rounded-[var(--radius-card)]`
- [ ] Build проходит без ошибок

### Phase 3 — Empty States

- [ ] Создан `shared/ui/feedback/` subdirectory
- [ ] `shared/ui/feedback/empty-state.tsx` с `LucideIcon`, без `action` prop, с
      `role="status"`
- [ ] Title использует `text-foreground` (не muted)
- [ ] EmptyState добавлен в Follow-ups, Teams, Methodology
- [ ] Тест написан

### Phase 4 — Chart Colors

- [ ] `shared/lib/chart-theme.ts` создан (только 3 структурных константы)
- [ ] Все 7 файлов обновлены
- [ ] Tooltip тёмный, cursor исправлен во всех чартах

### Phase 5 — Тесты

- [ ] `shared/ui/card/__tests__/Card.test.tsx` создан (4 теста)
- [ ] `shared/ui/feedback/__tests__/EmptyState.test.tsx` создан
- [ ] Все 1012 тестов продолжают проходить

### Phase 6 — Рефакторинг

- [ ] `features/demo/index.ts` создан, импорт в layout обновлён
- [ ] `LandingHero.tsx` — private sub-components
- [ ] `artifact-panel.tsx` — `ArtifactCard`, `ArtifactContent` в `artifacts/`
- [ ] `ChartArtifactView` — `dynamic({ ssr: false })`

---

## Dependencies & Risks

| Риск                                                          | Вероятность | Митигация                                        |
| ------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| Phase 0.1 (mountedRef fix) сломает polling                    | Средняя     | Тест: смена chatId → новые артефакты загружаются |
| `dynamic()` для recharts — SSR flash                          | Средняя     | `loading: () => <Skeleton />` eliminates flash   |
| Phase 6 рефакторинг сломает импорты                           | Средняя     | Создать index.ts ПЕРВЫМ, потом рефакторить       |
| `shared/ui/feedback/` — сломает существующие импорты `error/` | Низкая      | ErrorDisplay остаётся в `error/`, не перемещать  |
| chart-theme.ts рассинхронизируется с globals.css              | Низкая      | Комментарий "менять вместе"                      |
| Follow-ups SkeletonList — avatar circle не match layout       | Средняя     | Проверить реальную структуру строк перед Phase 2 |

---

## References

- Существующие loading: `app/dashboard/teams/loading.tsx`,
  `app/dashboard/statistics/loading.tsx`
- Skeleton компоненты: `shared/ui/layout/skeleton.tsx`
- SpinLoader: `shared/ui/layout/spin-loader.tsx`
- Opacity animation: `shared/ui/animation/` (для EmptyState входа)
- Пример empty state: `features/organization/ui/organization-list-empty.tsx`
- Пример sub-components паттерна: `features/summary/ui/MeetingStats.tsx`
- CSS-переменные: `app/globals.css` строки 3–50
- Существующий `CHART_COLORS` массив:
  `features/chat/ui/artifacts/chart-artifact.tsx:20-26`
- mountedRef паттерн: `features/chat/ui/artifact-panel.tsx` (баг),
  `widgets/meeting/ui/event-overview.tsx` (правильный паттерн)
- Next.js loading docs:
  https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
