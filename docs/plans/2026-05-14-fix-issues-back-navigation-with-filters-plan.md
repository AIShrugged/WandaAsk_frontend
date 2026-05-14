---
title: fix: Issues Back Navigation with Filter Preservation
type: fix
status: completed
date: 2026-05-14
---

# fix: Issues Back Navigation with Filter Preservation

## Enhancement Summary

**Deepened on:** 2026-05-14 **Research agents used:** best-practices-researcher,
framework-docs-researcher, julik-frontend-races-reviewer,
kieran-typescript-reviewer, architecture-strategist, code-simplicity-reviewer,
security-sentinel, performance-oracle

### Key Improvements from Research

1. **`document.referrer` approach is invalid** — replaced with explicit `?from=`
   query param strategy (confirmed by 5 independent agents and official Next.js
   docs)
2. **`onBack` prop on `PageHeader` removed** — a function prop cannot cross the
   Server/Client boundary; would force all 13+ pages using PageHeader to become
   client components
3. **Simplified from 3 new files to 1 new file** — two separate wrapper
   components collapsed into one `IssueBackHeader` with a `title` prop
4. **FSD layer violation fixed** — features importing from widgets is invalid
   per FSD; wrappers now use `shared/ui` primitives only
5. **Security hardened** — regex anchored to pathname only, explicit same-origin
   check added
6. **`useCallback` + `typeof document` guard removed** — redundant in this
   context with React Compiler active

---

## Overview

На страницах создания (`/dashboard/issues/create`) и просмотра/редактирования
(`/dashboard/issues/[id]`) кнопка «Назад» ведёт себя некорректно:

1. После создания issue происходит редирект на `/dashboard/issues/:id`, и
   нажатие «Назад» возвращает на форму создания (browser history loop).
2. При прямом переходе на `/dashboard/issues/:id` (нет history) нажатие «Назад»
   закрывает приложение.
3. Фильтры из `SharedFilters` (organization_id, assignee_id, status, type и
   т.д.) не сохраняются при переходе назад — пользователь теряет контекст.

**Ожидаемое поведение:** кнопка «Назад» на обеих страницах всегда ведёт на
список задач (`/dashboard/issues/kanban` или последний активный таб) с
восстановленными фильтрами.

---

## Анализ корневой причины

### Текущий `ButtonBack` (shared/ui/button/button-back.tsx)

```tsx
onClick={() => {
  if (fallbackHref && globalThis.history.length <= 1) {
    router.push(fallbackHref); // только при отсутствии history
  } else {
    router.back(); // ← проблема: возвращает на create форму после redirect
  }
}}
```

- После `createIssue()` форма делает `router.push('/issues/123')` — browser
  history теперь: `[..., /issues/create, /issues/123]`. Нажатие «Назад» →
  `router.back()` → `/issues/create`. Цикл.
- `history.length <= 1` в SPA практически никогда не выполняется — после первой
  навигации history.length всегда > 1.

### Почему `document.referrer` НЕ работает для этой задачи

> **Критическая находка из исследования:** `document.referrer` обновляется
> только при полной загрузке страницы (HTTP navigation). `router.push()` в
> Next.js App Router использует History API (`pushState`) — документ не
> перезагружается, `document.referrer` **не изменяется**. Значение остаётся
> таким, каким было при первоначальной загрузке приложения.

Официальный источник: Next.js GitHub discussion #36723, #60546. Проверено на
практике: `console.log(document.referrer)` не меняется при SPA-навигации между
роутами.

Сценарии, когда `document.referrer` пустой или неверный:

- Прямой заход по URL (bookmark, адресная строка)
- SPA client-side навигация через `router.push()` / `<Link>` (всегда!)
- Refresh страницы
- Браузеры с `Referrer-Policy: no-referrer` или privacy-режим
- Прямая ссылка из внешнего источника

### Правильный подход — `?from=` query parameter

Фильтры уже живут в URL как search params
(`?organization_id=2&assignee_id=5&status=in_progress`). Нужно передать этот URL
вперёд при навигации к detail/create странице. Это:

- Explicit и надёжный — работает при direct URL entry, refresh, после redirect
- SSR-совместим — `searchParams` читается в Server Component без хуков
- Нет новых зависимостей, нет `document` API, нет sessionStorage
- Идиоматичный Next.js App Router паттерн (официальная документация)

---

## Решение

### Стратегия: `?from=` query parameter

**При навигации на detail/create** передаём current tab URL (pathname + search)
в параметре `from`:

```
/dashboard/issues/123?from=%2Fdashboard%2Fissues%2Fkanban%3Fassignee_id%3D5%26status%3Din_progress
```

**На странице detail/create** Server Component читает `from` из `searchParams` и
передаёт как `fallbackHref` в `ButtonBack` (через уже существующий pipe:
PageHeader → ButtonBack).

Изменений в `ButtonBack` минимум: принять `href?: string` prop как явный адрес
назад (вместо сложной логики с `router.back()`). Когда `href` задан — всегда
`router.push(href)`. Когда нет — текущая логика.

---

## Детальный план реализации

### 1. Расширить `ButtonBack` — добавить prop `href`

**Файл:** `shared/ui/button/button-back.tsx`

Добавить опциональный `href` prop. Семантика: «перейти именно сюда», в отличие
от `fallbackHref` («только если нет history»).

```tsx
// shared/ui/button/button-back.tsx
'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ButtonBackProps {
  fallbackHref?: string;
  href?: string;
}

export default function ButtonBack({ fallbackHref, href }: ButtonBackProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (href) {
          router.push(href);
          return;
        }
        if (fallbackHref && globalThis.history.length <= 1) {
          router.push(fallbackHref);
        } else {
          router.back();
        }
      }}
      className='cursor-pointer text-primary'
      aria-label='Back'
    >
      <ChevronLeft size={36} />
    </button>
  );
}
```

**Что изменилось vs исходный план:**

- Добавлен `href` (явное назначение) вместо `onClick` (callback)
- Props вынесены в именованный `interface ButtonBackProps` (требование
  `props-extraction-threshold`)
- Убран `onClick?: () => void` — декларативный `href` лучше тестируется и
  понятнее
- Полная обратная совместимость — все 13+ страниц с `hasButtonBack` без
  изменений

### 2. Расширить `PageHeader` — добавить prop `href`

**Файл:** `widgets/layout/ui/page-header.tsx`

Прокинуть новый `href` проп от `PageHeader` к `ButtonBack`.

```tsx
// widgets/layout/ui/page-header.tsx

export default function PageHeader({
  title,
  hasButtonBack,
  fallbackHref,
  href, // ← новый prop: явный адрес для кнопки «Назад»
  extraContent,
}: {
  title: string;
  hasButtonBack?: boolean;
  fallbackHref?: string;
  href?: string;
  extraContent?: React.ReactNode;
}) {
  return (
    <ComponentHeader>
      {hasButtonBack && <ButtonBack fallbackHref={fallbackHref} href={href} />}
      <H2>{title}</H2>
      <div className='ml-auto'>{extraContent}</div>
    </ComponentHeader>
  );
}
```

**Критически важно:** `PageHeader` остаётся Server Component. `href` — это
`string`, полностью сериализуемый тип. Нет нарушения Server/Client boundary. Все
существующие вызовы без изменений.

> **Research insight (Performance Oracle):** Если бы мы добавили
> `onBack?: () => void`, `PageHeader` пришлось бы пометить `'use client'` —
> функции не сериализуются через RSC boundary. Это бы превратило все 13+ страниц
> в Client Components. Строковый `href` безопасен.

### 3. Обновить `IssueCreateButton` — добавить `?from=` к href

`IssueCreateButton` рендерится внутри `IssuesLayoutClient`, который имеет доступ
к `useSearchParams()` и `usePathname()`. Нужно сделать `IssueCreateButton`
клиентским и передать текущий URL.

**Файл:** `features/issues/ui/issue-create-button.tsx`

```tsx
// features/issues/ui/issue-create-button.tsx
'use client';

import { Plus } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';
import { ButtonLink } from '@/shared/ui/button';

export default function IssueCreateButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams.toString();
  const from = encodeURIComponent(params ? `${pathname}?${params}` : pathname);

  return (
    <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
      <ButtonLink
        href={`${ROUTES.DASHBOARD.ISSUES}/create?from=${from}`}
        leftIcon={<Plus className='h-4 w-4' />}
      >
        New
      </ButtonLink>
    </div>
  );
}
```

### 4. Обновить `IssueForm` — после создания issue передать `?from=` в redirect

В `issue-form.tsx` после успешного создания делается
`router.push('/issues/123')`. Нужно передать `from` параметр дальше в detail
URL, чтобы и там кнопка «Назад» знала, куда идти.

**Файл:** `features/issues/ui/issue-form.tsx`

Добавить prop `backHref?: string` в `IssueFormProps`:

```tsx
interface IssueFormProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  epics?: EpicOption[];
  issue?: Issue;
  defaultOrganizationId?: string;
  currentUser?: UserBasicProps | null;
  backHref?: string; // ← новый prop: передаётся с create/detail страницы
}
```

В `onSubmit`, при успешном создании:

```tsx
// было:
router.push(`${ROUTES.DASHBOARD.ISSUES}/${result.data.id}`);

// стало:
const detailUrl = backHref
  ? `${ROUTES.DASHBOARD.ISSUES}/${result.data.id}?from=${encodeURIComponent(backHref)}`
  : `${ROUTES.DASHBOARD.ISSUES}/${result.data.id}`;
router.push(detailUrl);
```

При удалении issue (уже ведёт на `ROUTES.DASHBOARD.ISSUES` — оставить как есть,
fallback достаточен).

### 5. Обновить страницу создания — читать `from` из searchParams

**Файл:** `app/dashboard/issues/(create)/create/page.tsx`

Server Component читает `searchParams.from` и передаёт как `href` в `PageHeader`
и как `backHref` в `IssueForm`.

```tsx
export default async function IssueCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  // Validate: only accept internal issues tab paths
  const backHref = validateBackHref(from) ?? ROUTES.DASHBOARD.ISSUES_KANBAN;

  const [organizationsResponse, persons, epics, organizationId, userResponse] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getEpics().catch(() => []),
      getOrganizationId(),
      getUser(),
    ]);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack href={backHref} title='Create task' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <IssueForm
            organizations={organizationsResponse.data ?? []}
            persons={persons}
            epics={epics}
            defaultOrganizationId={organizationId}
            currentUser={userResponse.data ?? null}
            backHref={backHref}
          />
        </CardBody>
      </div>
    </Card>
  );
}
```

### 6. Обновить страницу детали issue — читать `from` из searchParams

**Файл:** `app/dashboard/issues/[id]/page.tsx`

```tsx
export default async function IssueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;

  const backHref = validateBackHref(from) ?? ROUTES.DASHBOARD.ISSUES_KANBAN;

  // ... (остальные fetches без изменений)

  return (
    <div className='h-full overflow-y-auto'>
      <div className='grid min-h-full gap-6 xl:grid-cols-[...]'>
        <div className='flex flex-col gap-6'>
          <Card className='flex flex-col'>
            <PageHeader
              hasButtonBack
              href={backHref} // ← заменяет fallbackHref=ISSUES_KANBAN
              title='Task'
              extraContent={isArchived ? <span>Archived</span> : undefined}
            />
            ...
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### 7. Создать `validateBackHref` в shared/lib

**Файл:** `shared/lib/validate-back-href.ts`

Security-safe валидация `from` параметра перед использованием.

```ts
// shared/lib/validate-back-href.ts
const ALLOWED_BACK_PATHS = [
  '/dashboard/issues/kanban',
  '/dashboard/issues/list',
  '/dashboard/issues/progress',
] as const;

/**
 * Validates and decodes a `from` query param for safe back-navigation.
 * Only allows paths to the issues tab pages. Returns null for invalid input.
 */
export function validateBackHref(from: string | undefined): string | null {
  if (!from) return null;

  try {
    const decoded = decodeURIComponent(from);
    // Must be a root-relative path (no origin/hostname)
    if (!decoded.startsWith('/')) return null;

    const url = new URL(decoded, 'https://placeholder.invalid');
    const isAllowed = ALLOWED_BACK_PATHS.some((path) =>
      url.pathname.startsWith(path),
    );

    return isAllowed ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}
```

> **Research insight (Security Sentinel):** Всегда проверять `pathname`
> отдельно, не весь URL string — иначе `evil.com/?x=/dashboard/issues/kanban`
> пройдёт проверку. Использовать whitelist, а не regex с lookahead.
> `new URL(decoded, 'https://placeholder.invalid')` нормализует путь и
> предотвращает path traversal (`../` резолвится браузером до построения URL).

### 8. Обновить issue-detail links в list/kanban — передавать `?from=`

Для **kanban card** (`features/kanban/ui/kanban-card-item.tsx`) и **list rows**
(`features/issues/ui/issues-page.tsx`), которые находятся внутри
`IssuesLayoutClient` и имеют доступ к `useSearchParams()`:

Создать хук `useIssueDetailHref` (внутри features/issues) для построения ссылки
на detail с `?from=`:

```ts
// features/issues/hooks/use-issue-detail-href.ts
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

/**
 * Returns a function that builds an issue detail href with ?from= param
 * preserving the current tab URL and filter state.
 */
export function useIssueDetailHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (issueId: number | string) => {
    const params = searchParams.toString();
    const from = encodeURIComponent(
      params ? `${pathname}?${params}` : pathname,
    );
    return `${ROUTES.DASHBOARD.ISSUES}/${issueId}?from=${from}`;
  };
}
```

Использовать в `kanban-card-item.tsx` и `issues-page.tsx` (list rows).

> **Simplicity insight:** Вместо передачи `from` в каждый компонент через props
> — общий хук, вызываемый там, где есть контекст `IssuesLayoutClient`. Kanban
> card и list rows уже клиентские компоненты.

---

## Затронутые файлы

| Файл                                             | Изменение                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `shared/ui/button/button-back.tsx`               | Добавить `href?: string` prop + именованный interface            |
| `shared/lib/validate-back-href.ts`               | **Новый файл** — security-safe валидация `from` param            |
| `widgets/layout/ui/page-header.tsx`              | Добавить `href?: string` prop, прокинуть в ButtonBack            |
| `features/issues/ui/issue-create-button.tsx`     | Добавить `'use client'`, строить `?from=` из useSearchParams     |
| `features/issues/ui/issue-form.tsx`              | Добавить `backHref` prop, передавать в detail URL после создания |
| `features/issues/hooks/use-issue-detail-href.ts` | **Новый файл** — хук для построения detail href с `?from=`       |
| `features/kanban/ui/kanban-card-item.tsx`        | Использовать `useIssueDetailHref()`                              |
| `features/issues/ui/issues-page.tsx`             | Использовать `useIssueDetailHref()` для issue row links          |
| `app/dashboard/issues/(create)/create/page.tsx`  | Читать `searchParams.from`, передать в PageHeader и IssueForm    |
| `app/dashboard/issues/[id]/page.tsx`             | Читать `searchParams.from`, передать в PageHeader                |

**Что НЕ нужно создавать (оптимизация по итогам ревью):**

- ~~`IssueCreatePageHeader`~~ — не нужен, `PageHeader` остаётся Server Component
- ~~`IssueDetailPageHeader`~~ — не нужен, `PageHeader` остаётся Server Component
- ~~`useIssuesBackHref`~~ — заменён на `validateBackHref` (shared/lib) +
  `useIssueDetailHref` (hook)

---

## Acceptance Criteria

- [x] Нажатие «Назад» на `/dashboard/issues/create?from=...` → переход на URL из
      `from` param с фильтрами
- [x] Нажатие «Назад» на `/dashboard/issues/create` (нет `from`, прямой заход) →
      переход на `ISSUES_KANBAN`
- [x] Нажатие «Назад» на `/dashboard/issues/[id]?from=...` → переход на URL из
      `from` param
- [x] Нажатие «Назад» на `/dashboard/issues/[id]` (нет `from`, прямой заход) →
      переход на `ISSUES_KANBAN`, приложение не закрывается
- [x] После создания issue (redirect → `/issues/123?from=...`) нажатие «Назад»
      НЕ возвращает на форму создания, а идёт на список
- [x] Клик на карточку в Kanban → `?from=/dashboard/issues/kanban?<filters>`
      передаётся
- [x] Клик на строку в List tab → `?from=/dashboard/issues/list?<filters>`
      передаётся
- [x] `ButtonBack` обратно совместим: все страницы без `href` работают как
      раньше
- [x] `PageHeader` остаётся Server Component (строковый `href`, не функция)
- [x] `validateBackHref` отклоняет внешние URL, path traversal, и пути вне
      разрешённого whitelist
- [x] FSD-границы не нарушены: `features/issues` не импортирует из `widgets/`

---

## Нюансы и риски

### Пути из `today-briefing`, `teams` и `kanban` — без `?from=`

Ссылки на issue detail из `features/today-briefing/`, `features/teams/`,
`features/kanban/ui/kanban-card-modal.tsx` не будут передавать `?from=`. Это
нормально: fallback на `ISSUES_KANBAN` — правильное поведение. Пользователь из
today-briefing не ожидает вернуться на issues list.

Только ссылки внутри `IssuesLayoutClient` (kanban-card-item, issues-page list
rows, issue-create-button) должны передавать `?from=`.

### `IssueCreateButton` становится `'use client'`

`IssueCreateButton` рендерится внутри `IssuesLayoutClient` (который уже
`'use client'`), поэтому граница уже существует. Добавление `'use client'` к
самому компоненту не расширяет client bundle.

### `searchParams` в Next.js 16 — обязательно `await`

В Next.js 16 `searchParams` в page.tsx — это `Promise`. Обязательно
`await searchParams` перед использованием. Это breaking change Next.js 16
(переход с синхронного на async).

### `validateBackHref` в `shared/lib` — FSD compliance

Функция валидации идёт в `shared/lib/`, а не в `features/issues/`, потому что
она не зависит от доменной логики issues и потенциально может использоваться
другими фичами.

### Тесты для `validateBackHref`

Функция чисто синхронная, легко тестируема:

```ts
// shared/lib/__tests__/validate-back-href.test.ts
// Сценарии:
// ✅ '/dashboard/issues/kanban?assignee_id=5' → тот же путь
// ✅ '/dashboard/issues/list' → без params
// ❌ '' → null
// ❌ undefined → null
// ❌ '/dashboard/teams/1' → null (не в whitelist)
// ❌ 'https://evil.com/dashboard/issues/kanban' → null (не root-relative)
// ❌ '../../../admin' → null (path traversal)
// ❌ 'javascript:alert(1)' → null (не root-relative)
```

### Тесты для `ButtonBack` — добавить кейс для `href`

```ts
// Добавить в button-back.test.tsx:
it('calls router.push with href when href prop is provided', () => {
  render(<ButtonBack href='/dashboard/issues/kanban?status=open' />);
  fireEvent.click(screen.getByRole('button', { name: /back/i }));
  expect(mockPush).toHaveBeenCalledWith('/dashboard/issues/kanban?status=open');
  expect(mockBack).not.toHaveBeenCalled();
});
```

---

## Связанные файлы для контекста

- `shared/ui/button/button-back.tsx:1` — текущая реализация ButtonBack
- `widgets/layout/ui/page-header.tsx:1` — текущий PageHeader (Server Component)
- `features/issues/ui/issues-layout-client.tsx:49` — useSearchParams() и
  usePathname()
- `features/issues/ui/issue-form.tsx:230` — router.push после создания
- `features/issues/ui/issue-create-button.tsx:1` — кнопка создания
- `features/kanban/ui/kanban-card-item.tsx:42` — Link к issue detail
- `features/issues/ui/issues-page.tsx:575` — Link к issue detail в list tab
- `shared/ui/navigation/page-tabs-nav.tsx:1` — preserveSearchParams паттерн
  (аналог)

---

## References

- [Next.js useRouter API Reference](https://nextjs.org/docs/app/api-reference/functions/use-router)
  — `router.push(pathname + search)` is the canonical pattern
- [Next.js: Retrieve previous route history — Discussion #36723](https://github.com/vercel/next.js/discussions/36723)
  — confirms `document.referrer` is empty for SPA navigation
- [Server and Client Components — Next.js Docs](https://nextjs.org/docs/app/getting-started/server-and-client-components)
  — functions not serializable across RSC boundary
- [MDN: document.referrer](https://developer.mozilla.org/en-US/docs/Web/API/Document/referrer)
  — only updated on full HTTP document load
- [Next.js 16: async searchParams](https://nextjs.org/blog/next-16) —
  searchParams is now a Promise in page.tsx
