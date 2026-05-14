---
title: 'refactor: Auth Forms — Code Quality, UX & WOW Effect'
type: refactor
status: active
date: 2026-05-14
deepened: 2026-05-14
---

# refactor: Auth Forms — Code Quality, UX & WOW Effect

## Enhancement Summary

**Deepened on:** 2026-05-14 **Research agents used:** best-practices-researcher,
security-sentinel, kieran-typescript-reviewer (×2), performance-oracle,
code-simplicity-reviewer, architecture-strategist, accessibility-auditor,
spec-flow-analyzer

### Key Improvements Discovered

1. **`tailwindcss-animate` не установлен** — все
   `animate-in`/`fade-in`/`slide-in-from-bottom` классы — no-op в production.
   Нужно либо установить `tw-animate-css`, либо определить кастомные keyframes.
2. **`COLORS[strength].replace('bg-', 'text-')` — production bug** — Tailwind
   purges динамически генерируемые классы. Нужен явный `TEXT_COLORS` record.
3. **`AuthCard` в `widgets/` — неверный FSD-слой**; правильно —
   `features/auth/ui/auth-card.tsx`.
4. **`acceptTerms` проблема глубже** — не только схема, но и тип `RegisterInput`
   расходится с `RegisterDTO`, плюс поле уходит на бэкенд в JSON body.
5. **Критические security issues** найдены: нет rate limiting на login/register,
   logout не чистит cookie при ошибке, нет `middleware.ts` для auth guard.
6. **Критические a11y violations** найдены: `role="alert"` +
   `aria-live="polite"` конфликт, нет `<main>` в auth layout, `lang='ru'` в
   global-error.tsx, нет per-page `<title>`.
7. **`Controller → VARIANT_MAPPER` паттерн** повторяется 4 раза — следует
   вынести в `shared/ui/input/field-controller.tsx`.
8. **`PasswordStrengthBar`** нужен `role="meter"` с полным ARIA для доступности.
9. **Autofill bug**: `isDirty` блокирует submit для пользователей с password
   manager.

### New Considerations vs Original Plan

- Stagger анимация (75ms delay между полями) — отклонена как YAGNI для 2-4 полей
- `widgets/auth-card/` → переименовать в `features/auth/ui/auth-card.tsx`
- `features/auth/lib/password-strength.ts` → co-locate в компоненте (одна
  утилита, один потребитель)
- `options.tsx` → удалить полностью (inline 3 константы)
- Добавить `loading.tsx` для всех 6 auth-маршрутов (требование проекта, сейчас
  отсутствуют)
- Добавить `app/auth/error.tsx` boundary

---

## Overview

Полный рефакторинг четырёх auth-форм (login, register, forgot-password,
reset-password): устранить дублирование, исправить баги, выровнять по правилам
проекта, улучшить UX, добавить анимацию и password strength indicator. Это
первое, что видит пользователь — качество и полировка критичны.

---

## Найденные проблемы

### 🐛 Bugs / Contract mismatches

| #   | Файл                                | Проблема                                                                                                                                                         |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `features/auth/lib/fields.tsx`      | `acceptTerms` checkbox присутствует в `REGISTER_FIELDS` и `REGISTER_FIELDS_VALUES`, но **не описан в `RegisterSchema`** → нет Zod-валидации, не блокирует submit |
| 2   | `features/auth/api/auth.ts`         | `JSON.stringify(validated)` отправляет `acceptTerms: true` на бэкенд — поле бэкенд не ожидает                                                                    |
| 3   | `features/auth/model/types.ts`      | `RegisterDTO` содержит `acceptTerms: boolean`, но `RegisterInput` (из Zod schema) будет `acceptTerms: true` — типы расходятся                                    |
| 4   | `features/auth/lib/fields.tsx`      | Поле `passwordField` содержит `rules: { required, minLength }` — dead code (zodResolver их игнорирует)                                                           |
| 5   | `features/auth/lib/options.tsx`     | `AUTH_TITLE_VARIANT` и `BUTTON_TEXT` — `AuthTitle` нигде не используется в страницах, `BUTTON_TEXT` — 3 строки, можно инлайнить                                  |
| 6   | `app/auth/login/page.tsx`           | `async` без `await` — лишний модификатор                                                                                                                         |
| 7   | `app/auth/forgot-password/page.tsx` | `async` без `await` — лишний модификатор                                                                                                                         |
| 8   | `app/auth/reset-password/page.tsx`  | `async` без `await` — лишний модификатор                                                                                                                         |
| 9   | `features/auth/api/auth.ts:193,226` | `normalizeAuthRequestError(error, 'login')` в `forgotPassword` и `resetPassword` — неверный action label                                                         |
| 10  | `features/auth/lib/fields.tsx:55`   | `<Link href=''>Terms & Privacy Policy</Link>` — broken link (navigates to current page)                                                                          |
| 11  | `shared/api/session.ts`             | `logout()` не очищает cookie и не делает редирект если бэкенд вернул не-ok статус                                                                                |
| 12  | `app/global-error.tsx`              | `lang='ru'` — screen readers переключаются на русский язык для страницы ошибки                                                                                   |

### 🔄 Дублирование кода

| Дублирование                                                                            | Где                                                                                                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `<div className="flex justify-center mb-8"><TribesLogo /></div>` + Card + heading block | `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`               |
| `w-full max-w-[400px]` обёртка                                                          | Все 4 page.tsx                                                                                             |
| Паттерн `Controller → VARIANT_MAPPER[variant]`                                          | `login-form`, `register-form`, `forgot-password-form`, `reset-password-form` (4 одинаковых render-функции) |

### 📐 Нарушения правил проекта

| Нарушение                                                                       | Файл                                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `features/auth/api/auth.ts` использует `raw fetch` вместо `httpClient`          | Intentional исключение (cookie management) — нужен комментарий          |
| `features/auth/lib/fields.tsx` содержит JSX (`Link`) — нарушение (lib/ без JSX) | `fields.tsx`                                                            |
| `reset-password-form.tsx` определяет поля локально как module-level constants   | Это правильно (used only here), план не должен выносить их в fields.tsx |
| Комментарии `/** JSDoc */` без содержательного WHY                              | Несколько файлов                                                        |

### ✍️ Типографика и шрифты

| Проблема                                                                      | Где            |
| ----------------------------------------------------------------------------- | -------------- |
| `--font-display` (Instrument Serif, italic) только на quote слева             | `layout.tsx`   |
| Нет per-page `<title>` — все auth страницы имеют одинаковый browser tab title | Все 4 page.tsx |

### 🚨 Security Issues (новые, найденные при анализе)

| Приоритет | Issue                                                                        | Файл                               |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| CRITICAL  | Нет rate limiting на `/auth/login` и `/auth/register`                        | `backend/routes/api.php`           |
| CRITICAL  | Password reset не инвалидирует существующие Sanctum-токены                   | `backend/PasswordResetService.php` |
| HIGH      | Нет `middleware.ts` для route-level auth guard на `/dashboard/*`             | Отсутствует                        |
| HIGH      | `invite` token из URL без max length/format validation                       | `schemas.ts`, `register-form.tsx`  |
| MEDIUM    | Нет `429` handling во всех auth Server Actions                               | `auth.ts`                          |
| MEDIUM    | Password min(6) в Login/Register vs min(8) в Reset — несоответствие          | `schemas.ts`                       |
| MEDIUM    | `secure` cookie flag — только в `production`, но staging может быть на HTTPS | `auth.ts`                          |
| LOW       | Нет `max()` на email/name/password в Zod-схемах                              | `schemas.ts`                       |
| LOW       | bcrypt truncates passwords > 72 bytes silently                               | Backend                            |

### ♿ Accessibility Violations (новые)

| WCAG     | Issue                                                                                            | Файл                             |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------------------- |
| 4.1.3 AA | `role="alert"` + `aria-live="polite"` — конфликт; должно быть просто `role="alert"`              | Все 4 формы + `Error.tsx`        |
| 1.3.1 A  | `aria-describedby` на `form-error` — элемент conditionally rendered; должен всегда существовать  | Все 4 формы                      |
| 3.3.1 A  | `acceptTerms` checkbox: нет `aria-required`, нет error-to-input linkage через `aria-describedby` | `Checkbox.tsx`, `fields.tsx`     |
| 2.4.1 A  | Нет `<main>` landmark в auth layout                                                              | `app/auth/layout.tsx`            |
| 3.1.1 A  | `global-error.tsx` имеет `lang='ru'`                                                             | `app/global-error.tsx`           |
| 2.4.2 A  | Нет per-page `<title>` — все auth страницы одинаковы                                             | Все 4 page.tsx                   |
| 1.3.1 A  | Required поля не имеют `aria-required`                                                           | `Input.tsx`, `InputDropdown.tsx` |
| 4.1.3 AA | Forgot-password success state: нет focus management и live region                                | `forgot-password-form.tsx`       |

---

## Предлагаемые улучшения

### 1. `features/auth/ui/auth-card.tsx` — Server Component (не `widgets/`)

> **Architectural decision**: `AuthCard` не является виджетом (widgets
> комбинируют несколько features). Он использует только `shared/ui/brand` и
> `shared/ui/card` — значит принадлежит `features/auth/ui/`.

```tsx
// features/auth/ui/auth-card.tsx
import type { PropsWithChildren } from 'react';
import { TribesLogo } from '@/shared/ui/brand';
import { Card } from '@/shared/ui/card';

interface AuthCardProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className='w-full max-w-[400px] auth-card-enter'>
      <div className='flex justify-center mb-8'>
        <TribesLogo />
      </div>
      <Card>
        <div className='px-8 py-10'>
          <div className='mb-8'>
            <h1 className='text-xl font-semibold tracking-tight'>{title}</h1>
            <p className='text-sm text-muted-foreground mt-1'>{subtitle}</p>
          </div>
          {children}
        </div>
      </Card>
    </div>
  );
}
```

После этого каждый `page.tsx` становится:

```tsx
// app/auth/login/page.tsx
import { LoginForm } from '@/features/auth';
import { AuthCard } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in — Tribes' };

export default function Page() {
  return (
    <AuthCard
      title='Sign in'
      subtitle='Welcome back — enter your credentials to continue'
    >
      <LoginForm />
    </AuthCard>
  );
}
```

### 2. CSS-анимация (без `tailwindcss-animate`)

> **Critical finding**: `tailwindcss-animate` не установлен. Все
> `animate-in`/`fade-in` классы — silent no-op. Нужно либо установить
> `tw-animate-css`, либо определить custom keyframes.

**Рекомендованный вариант B — кастомные keyframes в `globals.css`** (нет новых
зависимостей):

```css
/* globals.css — добавить в @layer utilities */
@keyframes auth-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-card-enter {
  animation: auth-card-enter 0.3s ease-out both;
}

/* prefers-reduced-motion уже обработан глобально в globals.css — дополнительного кода не нужно */
```

> Stagger-анимация на поля форм (75ms delay между каждым) — **ОТКЛОНЕНА** как
> YAGNI. Для 2-4 полей delay imperceptible или distracting. Нет UX-ценности для
> auth форм.

**Альтернатива (если хочется установить плагин):**

```bash
npm install tw-animate-css
```

```css
/* globals.css */
@import 'tw-animate-css'; /* перед @import 'tailwindcss' */
```

Тогда `animate-in fade-in zoom-in-95` работают для всего проекта включая
`PopupProvider.tsx` (который сейчас тоже broken).

### 3. Password Strength Indicator (register form only)

> **Co-location**: `getPasswordStrength` используется только в
> `PasswordStrengthBar` — выносить в отдельный файл YAGNI. Co-locate в
> компоненте.

> **Accessible**: использовать `role="meter"` с полным ARIA set.

> **Color safety**: вместо `COLORS[strength].replace('bg-', 'text-')` (purge
> risk) — явный `TEXT_COLORS` record.

```tsx
// features/auth/ui/password-strength-bar.tsx
'use client';

type Strength = 'weak' | 'medium' | 'strong';

const STRENGTH_LEVELS: Record<Strength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
};
const BAR_COLORS: Record<Strength, string> = {
  weak: 'bg-red-400',
  medium: 'bg-yellow-500',
  strong: 'bg-green-500',
};
const TEXT_COLORS: Record<Strength, string> = {
  weak: 'text-red-400',
  medium: 'text-yellow-500',
  strong: 'text-green-500',
};
const LABELS: Record<Strength, string> = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

function getPasswordStrength(password: string): Strength {
  if (password.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (password.length >= 12 && score >= 2) return 'strong';
  if (score >= 1) return 'medium';
  return 'weak';
}

interface Props {
  password: string;
}

export function PasswordStrengthBar({ password }: Props) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const level = STRENGTH_LEVELS[strength];

  return (
    <div
      role='meter'
      aria-label='Password strength'
      aria-valuenow={level}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuetext={LABELS[strength]}
      className='mt-1.5 space-y-1'
    >
      <div className='flex gap-1' aria-hidden='true'>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= level ? BAR_COLORS[strength] : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${TEXT_COLORS[strength]}`} aria-hidden='true'>
        {LABELS[strength]}
      </p>
    </div>
  );
}
```

Интеграция в `register-form.tsx`:

```tsx
// Подписаться на password через useWatch (не watch — чтобы не ре-рендерить всю форму)
const passwordValue = useWatch({ control, name: 'password' });

// После password Controller:
<PasswordStrengthBar password={passwordValue} />;
```

### 4. Исправить `acceptTerms` — три компонента изменения

**4a. Добавить в RegisterSchema:**

```ts
// features/auth/model/schemas.ts
acceptTerms: z.literal(true, { error: 'You must accept the Terms & Privacy Policy' }),
```

**4b. Обновить RegisterDTO:**

```ts
// features/auth/model/types.ts
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean; // форма использует boolean; Zod валидирует что значение === true
}
```

**4c. Strip из payload в register():**

```ts
// features/auth/api/auth.ts — в register()
const validated = RegisterSchema.parse(data);
const { acceptTerms: _, ...payload } = validated;
body: JSON.stringify(payload),
```

**4d. Исправить Terms link:**

```tsx
// fields.tsx — заменить href='' на реальный URL
labelExtra: (
  <Link className='cursor-pointer text-primary' href='/legal/terms' target='_blank' rel='noopener noreferrer'>
    Terms & Privacy Policy
  </Link>
),
```

> Если страница `/legal/terms` не существует — добавить в backlog, временно
> использовать `href='#'` с `onClick={e => e.preventDefault()}` — хуже, но
> честнее чем empty string.

### 5. `shared/ui/input/field-controller.tsx` — устранить 4× дублирование

```tsx
// shared/ui/input/field-controller.tsx
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { VARIANT_MAPPER } from '@/shared/lib/fieldMapper';
import type { VariantType } from '@/shared/lib/fieldMapper';

interface FieldConfig {
  name: string;
  variant: VariantType;
  [key: string]: unknown;
}

interface FieldControllerProps<T extends FieldValues> {
  field: FieldConfig;
  control: Control<T>;
  name: Path<T>;
}

export function FieldController<T extends FieldValues>({
  field,
  control,
  name,
}: FieldControllerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: hookField, fieldState }) => {
        const Component = VARIANT_MAPPER[field.variant];
        return (
          <Component field={hookField} fieldState={fieldState} config={field} />
        );
      }}
    />
  );
}
```

### 6. Исправить `auth.ts` — несколько правок

```ts
// auth.ts — добавить комментарий для raw fetch исключения:
// Auth actions use raw fetch (not httpClient) because they manage session cookies
// directly and have no Bearer token to inject during the login/register bootstrap.

// Исправить action labels:
// forgotPassword:
error: normalizeAuthRequestError(error, 'password reset').message,
// resetPassword:
error: normalizeAuthRequestError(error, 'password reset').message,

// Добавить 429 handling во всех четырёх actions:
if (res.status === 429) {
  throw new Error('Too many attempts. Please wait a minute and try again.');
}

// Добавить max() на поля схем:
email: z.email('...').max(254, 'Email is too long'),
password: z.string().min(8, '...').max(72, 'Password too long'),
name: z.string().min(2, '...').max(255, 'Name is too long'),
invite: z.string().max(128).optional(),
```

### 7. Исправить `logout()` — безусловная очистка

```ts
// shared/api/session.ts
export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { ... });
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    cookieStore.delete('organization_id');
    redirect(ROUTES.AUTH.LOGIN);
  }
}
```

### 8. Удалить dead code

**Перед удалением — grep:**

```bash
grep -r "AuthTitle\|AUTH_TITLE_VARIANT\|BUTTON_TEXT" . --include="*.tsx" --include="*.ts"
```

- `features/auth/ui/auth-title.tsx` — удалить
- `AUTH_TITLE_VARIANT` из `options.tsx` — удалить
- `BUTTON_TEXT` из `options.tsx` — inline константы в компонентах, удалить файл
- `rules: {}` из полей в `fields.tsx` — удалить
- Экспорты из `features/auth/index.ts` — убрать `AuthTitle`,
  `AUTH_TITLE_VARIANT`, `BUTTON_TEXT`

### 9. Accessibility fixes

**Auth layout — добавить `<main>` и `<aside>`:**

```tsx
// app/auth/layout.tsx
<div className='min-h-screen w-full bg-[var(--background)]'>
  <div className='grid min-h-screen lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_560px]'>
    <aside className='hidden lg:flex flex-col justify-center px-16 xl:px-24 border-r border-[var(--border)]' aria-label='Brand quote'>
      <blockquote ...>...</blockquote>
      ...
    </aside>
    <main className='flex items-center justify-center px-4 py-12 lg:px-12 bg-[var(--surface)]'>
      <div className='w-full max-w-sm'>{children}</div>
    </main>
  </div>
</div>
```

**Error.tsx — убрать конфликт `role`+`aria-live`:**

```tsx
// shared/ui/input/Error.tsx
<p id={id} className='mt-1 text-sm text-destructive' role='alert'>
  {children}
</p>
// Убрать aria-live="polite" — role="alert" уже implies assertive
```

**Форм-level error — всегда рендерить контейнер:**

```tsx
<p
  id='form-error'
  role='alert'
  aria-atomic='true'
  className='text-sm text-destructive text-center min-h-[1.25rem]'
>
  {errors.root?.message ?? ''}
</p>
<form aria-describedby='form-error' ...>
```

**global-error.tsx — исправить lang:**

```tsx
<html lang='en'>
```

**forgot-password success state — focus management:**

```tsx
const successRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (submitted) successRef.current?.focus();
}, [submitted]);

if (submitted) {
  return (
    <div
      ref={successRef}
      tabIndex={-1}
      role='status'
      className='flex flex-col gap-6 outline-none'
    >
      ...
    </div>
  );
}
```

**Per-page metadata:**

```ts
// app/auth/login/page.tsx
export const metadata: Metadata = { title: 'Sign in — Tribes' };
// register: 'Create account — Tribes'
// forgot-password: 'Forgot password — Tribes'
// reset-password: 'Reset password — Tribes'
```

**isDirty autofill bug — login form:**

```tsx
// Заменить disabled={isPending || !isDirty} на:
disabled={isPending || !isValid}
// И добавить mode: 'onChange' или trigger() после mount для autofill
```

### 10. Missing loading.tsx и error.tsx

**Создать skeleton loading.tsx для всех auth маршрутов:**

```
app/auth/login/loading.tsx
app/auth/register/loading.tsx
app/auth/forgot-password/loading.tsx
app/auth/reset-password/loading.tsx
app/auth/organization/loading.tsx  ← наиболее важный (реальный async fetch)
app/auth/organization/create/loading.tsx
app/auth/error.tsx  ← NEW error boundary для auth segment
```

---

## Plan Implementation (Phases)

### Phase 1 — Дублирование и структура (30 мин)

- [ ] Создать `features/auth/ui/auth-card.tsx` (НЕ в widgets/)
- [ ] Добавить `AuthCard` в `features/auth/index.ts`
- [ ] Обновить `app/auth/login/page.tsx` → `AuthCard`, убрать `async`, добавить
      metadata
- [ ] Обновить `app/auth/register/page.tsx` → `AuthCard`, добавить metadata
- [ ] Обновить `app/auth/forgot-password/page.tsx` → `AuthCard`, убрать `async`,
      добавить metadata
- [ ] Обновить `app/auth/reset-password/page.tsx` → `AuthCard`, убрать `async`,
      добавить metadata
- [ ] Создать `shared/ui/input/field-controller.tsx` (устранить 4×
      `Controller/VARIANT_MAPPER` дублирование)
- [ ] Рефакторить все 4 формы на `FieldController`

### Phase 2 — Баги и схемы (45 мин)

- [ ] Добавить `acceptTerms: z.literal(true, { error: '...' })` в
      `RegisterSchema`
- [ ] Обновить `RegisterDTO` (`acceptTerms: boolean`)
- [ ] В `register()` — деструктурировать и выбросить `acceptTerms` перед
      JSON.stringify
- [ ] Добавить `max()` на все поля: email(254), name(255), password(72),
      invite(128)
- [ ] Унифицировать password min(8) во всех схемах (login, register, reset)
- [ ] Добавить 429 handling во все 4 auth actions
- [ ] Исправить `normalizeAuthRequestError(error, 'login')` в forgotPassword и
      resetPassword
- [ ] Добавить комментарий к raw fetch о причине исключения
- [ ] Исправить `logout()` → безусловная очистка cookie в `finally`
- [ ] Исправить Terms link (`href='/legal/terms'` или реальный URL)
- [ ] Исправить `secure` cookie:
      `process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'production'`

### Phase 3 — Dead code (15 мин)

- [ ] Grep:
      `grep -r "AuthTitle\|AUTH_TITLE_VARIANT\|BUTTON_TEXT" . --include="*.tsx" --include="*.ts"`
- [ ] Удалить `features/auth/ui/auth-title.tsx`
- [ ] Удалить `features/auth/ui/__tests__/auth-title.test.tsx`
- [ ] Удалить `AUTH_TITLE_VARIANT` и `BUTTON_TEXT` из `options.tsx` (или весь
      файл)
- [ ] Убрать из `features/auth/index.ts` экспорты мёртвых сущностей
- [ ] Убрать `rules: {}` из полей в `fields.tsx`
- [ ] Убрать JSX Link из `fields.tsx` (перенести в компонент register-form или
      отдельный checkbox-field)

### Phase 4 — WOW effect (30 мин)

- [ ] Проверить в `globals.css`: есть ли `@import 'tw-animate-css'` или
      `tailwindcss-animate` plugin?
- [ ] **Если нет** — добавить `@keyframes auth-card-enter` в `globals.css` и
      класс `.auth-card-enter`
- [ ] **Или** — `npm install tw-animate-css` и добавить
      `@import 'tw-animate-css'` (заодно починит `PopupProvider.tsx`)
- [ ] Применить анимацию на `AuthCard` wrapper
- [ ] Создать `features/auth/ui/password-strength-bar.tsx` (с co-located
      `getPasswordStrength`, role="meter", явным TEXT_COLORS)
- [ ] Интегрировать `PasswordStrengthBar` в `register-form.tsx` с
      `useWatch({ control, name: 'password' })`

### Phase 5 — Accessibility (30 мин)

- [ ] Обновить `app/auth/layout.tsx` — добавить `<aside>` и `<main>`
- [ ] Исправить `shared/ui/input/Error.tsx` — убрать `aria-live="polite"`
      (конфликт с `role="alert"`)
- [ ] Исправить form-level error paragraph во всех 4 формах — всегда рендерить,
      `aria-describedby` на форме
- [ ] Исправить `app/global-error.tsx` — `lang='en'`
- [ ] Добавить focus management в forgot-password success state
- [ ] Исправить `isDirty` autofill bug в login-form
- [ ] Добавить per-page metadata во все 4 страницы

### Phase 6 — Loading states и error boundaries (20 мин)

- [ ] Создать `app/auth/login/loading.tsx`
- [ ] Создать `app/auth/register/loading.tsx`
- [ ] Создать `app/auth/forgot-password/loading.tsx`
- [ ] Создать `app/auth/reset-password/loading.tsx`
- [ ] Создать `app/auth/organization/loading.tsx` (наиболее важный)
- [ ] Создать `app/auth/organization/create/loading.tsx`
- [ ] Создать `app/auth/error.tsx` error boundary

### Phase 7 — Тесты (45 мин)

- [ ] Обновить `schemas.test.ts` — добавить `acceptTerms: true` в `validData`,
      добавить 3 новых test cases для acceptTerms
- [ ] Обновить `auth.test.ts` — добавить `acceptTerms: true` во все 8 existing
      `register()` call sites; добавить тест что acceptTerms не попадает в
      payload
- [ ] Обновить `register-form.test.tsx` — добавить tick acceptTerms checkbox
      перед submit в тестах
- [ ] Удалить `auth-title.test.tsx`
- [ ] Создать `features/auth/ui/__tests__/password-strength-bar.test.tsx` — 4
      теста (пустой/weak/medium/strong)
- [ ] Создать `features/auth/ui/__tests__/auth-card.test.tsx` — 3 render теста
- [ ] Создать `shared/ui/input/__tests__/field-controller.test.tsx` — smoke
      tests

### Phase 8 — Quality check (15 мин)

- [ ] Убрать лишние JSDoc-комментарии
- [ ] `npm run lint:fix && npm run format`
- [ ] `npm test` — все тесты проходят
- [ ] `fsd-boundary-guard` агент
- [ ] `code-quality-guardian` агент

---

## Acceptance Criteria

### Functional

- [ ] Все 4 формы рендерятся без ошибок
- [ ] Login: submit с неверными данными → `root` ошибка; успех →
      `/auth/organization`
- [ ] Register: submit без acceptTerms → ошибка валидации; acceptTerms НЕ
      попадает на бэкенд (проверить в network logs)
- [ ] Register: password strength bar появляется при вводе пароля, обновляется в
      реальном времени
- [ ] Register: autofill из password manager не блокирует кнопку Submit
      (isDirty/isValid fix)
- [ ] Forgot password: success state показывается; focus перемещается на success
      message
- [ ] Reset password: без token → ошибка `root`; с истёкшим токеном → корректная
      ошибка
- [ ] Auth animation при загрузке страницы работает
- [ ] `logout()` всегда очищает cookie и редиректит, даже при ошибке бэкенда
- [ ] 429 ответ → user-friendly "Too many attempts" сообщение

### Code quality

- [ ] Нет дублирования Logo+Card block (все 4 страницы используют `AuthCard`)
- [ ] Нет `Controller/VARIANT_MAPPER` дублирования (используется
      `FieldController`)
- [ ] `acceptTerms: z.literal(true)` в `RegisterSchema`
- [ ] `acceptTerms` не в JSON body при регистрации
- [ ] Нет неиспользуемых экспортов в `features/auth/index.ts`
- [ ] `npm run lint` — 0 ошибок
- [ ] `npm test` — все тесты проходят
- [ ] Нет `any` типов
- [ ] `AuthCard` в `features/auth/ui/`, а не в `widgets/`
- [ ] `PasswordStrengthBar` содержит только static Tailwind class strings (нет
      `.replace()`)

### UX / A11y

- [ ] Auth card fade-in анимация при загрузке каждой страницы
- [ ] Password strength bar: 3 сегмента с корректными цветами, обновляется live
- [ ] Не показывает "Weak" на пустом поле пароля
- [ ] Terms link ведёт на реальный URL (не пустой `href=""`)
- [ ] `<main>` landmark в auth layout
- [ ] Per-page `<title>` — уникальный для каждой auth страницы
- [ ] `role="alert"` без конфликтующего `aria-live="polite"`
- [ ] `lang='en'` в `global-error.tsx`
- [ ] `role="meter"` на password strength bar
- [ ] Focus management после forgot-password success

---

## Файловая карта изменений

```
features/auth/
  ui/
    auth-card.tsx                      # NEW: Server Component (не widgets/)
    password-strength-bar.tsx          # NEW: с co-located getPasswordStrength, role="meter"
    login-form.tsx                     # MODIFY: FieldController, isValid autofill fix
    register-form.tsx                  # MODIFY: FieldController, PasswordStrengthBar
    forgot-password-form.tsx           # MODIFY: focus management на success state
    reset-password-form.tsx            # MODIFY: FieldController (оставить поля локально)
    auth-title.tsx                     # DELETE
    __tests__/
      auth-title.test.tsx              # DELETE
      auth-card.test.tsx               # NEW
      password-strength-bar.test.tsx   # NEW
  lib/
    fields.tsx                         # MODIFY: убрать rules{}, убрать JSX Link
    options.tsx                        # DELETE или оставить без BUTTON_TEXT/AUTH_TITLE_VARIANT
    password-strength.ts               # НЕ СОЗДАВАТЬ (co-locate в компоненте)
  model/
    schemas.ts                         # MODIFY: acceptTerms + max() + унификация min(8)
    types.ts                           # MODIFY: убрать acceptTerms из RegisterDTO или оставить boolean
  api/
    auth.ts                            # MODIFY: strip acceptTerms, fix labels, 429, logout, comments
    __tests__/
      auth.test.ts                     # MODIFY: acceptTerms: true в 8 test cases + payload test
  index.ts                             # MODIFY: убрать AuthTitle, AUTH_TITLE_VARIANT, BUTTON_TEXT

shared/
  ui/
    input/
      field-controller.tsx             # NEW: извлечь Controller/VARIANT_MAPPER паттерн
      Error.tsx                        # MODIFY: убрать aria-live="polite"
      __tests__/
        field-controller.test.tsx      # NEW
  api/
    session.ts                         # MODIFY: logout() с finally

app/
  auth/
    layout.tsx                         # MODIFY: <aside> + <main>
    error.tsx                          # NEW: error boundary
    login/
      page.tsx                         # MODIFY: AuthCard, убрать async, metadata
      loading.tsx                      # NEW
    register/
      page.tsx                         # MODIFY: AuthCard, metadata
      loading.tsx                      # NEW
    forgot-password/
      page.tsx                         # MODIFY: AuthCard, убрать async, metadata
      loading.tsx                      # NEW
    reset-password/
      page.tsx                         # MODIFY: AuthCard, убрать async, metadata
      loading.tsx                      # NEW
    organization/
      loading.tsx                      # NEW (наиболее важный — реальный async fetch)
      create/
        loading.tsx                    # NEW
  global-error.tsx                     # MODIFY: lang='en'

globals.css                            # MODIFY: добавить @keyframes auth-card-enter + .auth-card-enter
```

---

## Агенты для запуска

| Этап          | Агент                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| После Phase 1 | `fsd-boundary-guard` — проверить что AuthCard в features/ не нарушает границы     |
| После Phase 8 | `code-quality-guardian` — аудит новых компонентов                                 |
| По завершении | `mr-reviewer` — полный pre-push review                                            |
| Опционально   | `unit-test-booster` — дописать тесты для новых компонентов                        |
| Опционально   | `design-guardian` — проверить анимацию и PasswordStrengthBar против design system |

---

## Риски

| Риск                                                                                  | Митигация                                                                        |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `acceptTerms: z.literal(true)` сломает 8+ тестов в `auth.test.ts` и `schemas.test.ts` | Обновить все call sites одновременно с Phase 2 (подробный план в тестах Phase 7) |
| `isValid` замена `isDirty` в login может показывать ошибки раньше (mode: 'onBlur')    | Проверить в браузере; при необходимости `mode: 'onChange'` только для login      |
| `AuthTitle` используется в `organization/create/page.tsx`                             | Grep ПЕРЕД удалением; если используется — заменить на inline `<h1>` сначала      |
| `tw-animate-css` vs custom keyframes — разные API                                     | Принять решение до Phase 4 и придерживаться одного подхода                       |
| `FieldController` generic типы могут конфликтовать с FieldConfig shape                | Проверить компиляцию после интеграции; при необходимости сузить тип              |

---

## Known Issues (out of scope, но задокументированы)

> Следующие проблемы найдены при анализе но **вне scope данного рефакторинга**.
> Требуют отдельных задач:

- **C-1** (Backend): Нет rate limiting на `/auth/login` и `/auth/register` —
  добавить `throttle:10,1` middleware в `routes/api.php`
- **C-2** (Backend): Password reset не инвалидирует существующие Sanctum tokens
  — добавить `$user->tokens()->delete()` в `PasswordResetService`
- **H-4**: Нет `middleware.ts` для route-level `/dashboard/*` auth guard —
  создать отдельной задачей
- **M-2**: IDOR риск с `organization_id` cookie — требует backend policy audit
- **M-5**: Нет Content-Security-Policy header — добавить в `next.config.ts`
  отдельной задачей
- **L-2**: bcrypt truncates passwords > 72 bytes — рассмотреть Argon2id на
  backend
- **email_verification_sent**: Flow не реализован — нет holding page для
  верификации email
- **invite_accepted**: Нет UI feedback когда invite token invalid/expired

---

## Research Sources & Insights

### Institutional Learning Applied

- `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — подтверждает что `parseJsonResponse` helper уже реализован в `auth.ts` (safe
  two-step parse). Правило: никогда не использовать `res.json()` напрямую в
  Server Actions.

### Key Research Findings

- **NIST SP 800-63B (2024)**: min 8 chars, no complexity rules mandatory, max ≥
  64, no periodic rotation
- **react-hook-form UX**: `mode: 'onBlur'` + `reValidateMode: 'onChange'` —
  оптимальная комбинация для auth форм (Baymard Institute data)
- **Tailwind v4 animations**: нет `animate-in` из коробки, нужен
  `tw-animate-css` плагин или custom keyframes
- **WCAG password meter**: `role="meter"` + `aria-valuenow/min/max/valuetext` —
  правильный ARIA pattern
- **Server Action auth exception**: raw `fetch` оправдан для auth bootstrap (нет
  токена, нужно писать cookie)

---

## References

- `features/auth/ui/login-form.tsx` — текущая login форма
- `features/auth/ui/register-form.tsx` — register форма
- `features/auth/ui/forgot-password-form.tsx` — forgot password форма
- `features/auth/ui/reset-password-form.tsx` — reset password форма
- `features/auth/model/schemas.ts` — Zod-схемы
- `features/auth/api/auth.ts` — Server Actions
- `features/auth/lib/fields.tsx` — field configs (dead rules, dead checkbox)
- `app/auth/layout.tsx` — двухколоночный layout с quote
- `shared/ui/brand/TribesLogo.tsx` — лого компонент
- `shared/lib/formErrors.ts` — `handleFormError` helper
- `shared/api/session.ts` — `logout()` action
- `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — institutional learning о safe JSON parse
- CLAUDE.md → "API Layer Conventions" → Rule 2 (no raw fetch) — исключение для
  auth (cookie management)
- CLAUDE.md → "Tech Stack" → Zod v4 API (`z.literal(value, { error })`)
