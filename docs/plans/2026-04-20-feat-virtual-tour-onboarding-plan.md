---
title: 'feat: Virtual Tour Onboarding for New Users'
type: feat
status: active
date: 2026-04-20
---

# feat: Virtual Tour Onboarding for New Users

## Overview

Implement a step-based virtual tour that auto-launches for new users after
registration and guides them through the core features of WandaAsk. The tour is
a floating overlay that persists across page navigation, supports unlimited
steps with forward/back/skip controls, stores progress on the backend, and
always ends with Google Calendar OAuth as the final step. A "Restart Tour"
button is added to the Profile page.

---

## Problem Statement

New users who register have no guided introduction to the application. Without
onboarding, users may not discover core features (teams, calendar integration,
chat) or understand the layout. This leads to low activation rates and increased
support burden.

---

## Proposed Solution

A **VirtualTour** feature — a floating, portal-rendered overlay component that:

- Auto-launches when the authenticated user has `onboarding_completed = false`
- Persists across `router.push()` navigation (mounted at root layout level,
  never unmounts)
- Stores `onboarding_last_step` + `onboarding_completed` on the backend user
  record, resuming from where the user left off
- Is fully driven by a step configuration array — zero coupling between the tour
  shell and step content
- Can be restarted from the Profile page at any time

---

## Tour Steps (Ordered)

| #   | Title                    | Route                         | What is shown                                                          |
| --- | ------------------------ | ----------------------------- | ---------------------------------------------------------------------- |
| 1   | Welcome                  | any                           | Splash screen — intro to WandaAsk, what the tour covers                |
| 2   | Create Your Organization | `/dashboard/today`            | Explain organizations, how they group your people                      |
| 3   | Meet the Layout          | `/dashboard/today`            | Highlight sidebar, main area, and collapsible chat panel               |
| 4   | Create a Team            | `/dashboard/teams`            | Navigate to Teams, highlight the "Create Team" button                  |
| 5   | Invite Team Members      | `/dashboard/teams`            | Show the invite-by-email flow                                          |
| 6   | AI Chat — Ask Wanda      | `/dashboard/today`            | Highlight the chat panel, explain natural language queries             |
| 7   | Meetings & Agenda        | `/dashboard/meetings`         | Show the meetings calendar and what Wanda does with it                 |
| 8   | Issues & Kanban          | `/dashboard/issues`           | Brief intro to the task tracker                                        |
| 9   | Connect Google Calendar  | `/dashboard/profile/calendar` | **Always last.** Explain why, trigger OAuth. Skip marks tour complete. |

---

## Technical Approach

### Architecture — FSD Placement

```
features/virtual-tour/
  api/
    tour.ts                 # Server Actions: saveTourProgress, markTourComplete, resetTour
  model/
    tour-store.ts           # Zustand store: currentStepIndex, isOpen, isSaving
    types.ts                # TourStep, TourState, TourActions interfaces
    steps.ts                # Step definitions (content + route + spotlightSelector)
  ui/
    TourPortal.tsx          # createPortal to document.body — hydration-safe
    TourOverlay.tsx         # Backdrop + card shell (framer-motion)
    TourStepContent.tsx     # Renders current step: illustration slot + title + description
    TourControls.tsx        # Back / Next / Skip / Close buttons
    TourProgress.tsx        # Dot indicators
    TourSpotlight.tsx       # SVG mask spotlight (optional, per step)
    TourProvider.tsx        # Auto-launch logic, route navigation on step enter
    RestartTourSection.tsx  # Profile page section with restart button
  index.ts
```

### Component Hierarchy

```tsx
// Mounted in app/dashboard/layout.tsx (Server Component):
<DashboardProviders
  onboardingCompleted={user.onboarding_completed}
  onboardingLastStep={user.onboarding_last_step}
>
  {children}
</DashboardProviders>

// DashboardProviders (Client Component, 'use client'):
// Wraps existing ModalProvider + PopupProvider, adds TourProvider
<TourProvider isCompleted={isCompleted} initialStep={initialStep}>
  <ModalProvider>
    <PopupProvider>{children}</PopupProvider>
  </ModalProvider>
  <TourPortal />   {/* portal to document.body, rendered as sibling */}
</TourProvider>
```

> **Why `DashboardProviders`?** `app/Providers.tsx` is already a Client
> Component but does not receive user data. Rather than plumbing user data
> through `app/layout.tsx` → `app/Providers.tsx`, a new `DashboardProviders`
> wrapper in `app/dashboard/layout.tsx` is more surgical — it only affects the
> authenticated dashboard subtree.

> **Why TourProvider outside ModalProvider?** Tour z-index (`z-[10000]`) must
> exceed ModalRoot (`z-50`). The portal renders to `document.body` regardless of
> tree nesting, but keeping TourProvider outside ModalProvider avoids any future
> context conflicts.

### Hydration-Safe Portal Pattern

Copy exactly from `shared/ui/modal/modal-root.tsx`:

```tsx
// features/virtual-tour/ui/TourPortal.tsx
'use client';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { TourOverlay } from './TourOverlay';

const noopSubscribe = () => () => {};

export function TourPortal() {
  // Server snapshot = false → no portal on server; client snapshot = true → portal after hydration
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(<TourOverlay />, document.body);
}
```

This avoids the `useEffect` + `useState(false)` pattern and prevents hydration
mismatches cleanly.

### Step Configuration Interface

```ts
// features/virtual-tour/model/types.ts

export interface TourStep {
  id: string;
  title: string;
  description: string;
  route?: string; // if set, router.replace() on step enter
  illustration?: React.ReactNode; // slot for image, icon, or animated element
  spotlightSelector?: string; // CSS selector for SVG mask spotlight
  isLast?: boolean; // triggers OAuth CTA layout on last step
}

export interface TourState {
  isOpen: boolean;
  currentStepIndex: number;
  isSaving: boolean;
}

export interface TourActions {
  open: (startIndex?: number) => void;
  close: () => void;
  goNext: () => void;
  goBack: () => void;
  complete: () => void;
}
```

### Zustand Store

```ts
// features/virtual-tour/model/tour-store.ts
import { create } from 'zustand';
import type { TourState, TourActions } from './types';

export const useTourStore = create<TourState & TourActions>((set) => ({
  isOpen: false,
  currentStepIndex: 0,
  isSaving: false,
  open: (startIndex = 0) => set({ isOpen: true, currentStepIndex: startIndex }),
  close: () => set({ isOpen: false }),
  goNext: () => set((s) => ({ currentStepIndex: s.currentStepIndex + 1 })),
  goBack: () =>
    set((s) => ({ currentStepIndex: Math.max(0, s.currentStepIndex - 1) })),
  complete: () => set({ isOpen: false }),
}));
```

> Do NOT initialize from `onboarding_last_step` in the store — pass it via
> `TourProvider` props. This keeps the store free of server-fetched data and
> SSR-safe.

### TourProvider — Auto-launch & Navigation

```tsx
// features/virtual-tour/ui/TourProvider.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTourStore } from '../model/tour-store';
import { TOUR_STEPS } from '../model/steps';
import { saveTourProgress, markTourComplete } from '../api/tour';

interface TourProviderProps {
  isCompleted: boolean;
  initialStep: number;
  children: React.ReactNode;
}

export function TourProvider({
  isCompleted,
  initialStep,
  children,
}: TourProviderProps) {
  const { open, isOpen, currentStepIndex } = useTourStore();
  const router = useRouter();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-launch on mount if not completed — useEffect prevents SSR/hydration issues
  useEffect(() => {
    if (!isCompleted) {
      open(initialStep);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to step route on step change
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIndex];
    if (step?.route) {
      router.replace(step.route); // replace not push — back button exits tour, not prev step
    }
  }, [currentStepIndex, isOpen]);

  // Debounced progress save (600ms) — fire-and-forget, non-blocking
  useEffect(() => {
    if (!isOpen) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveTourProgress(currentStepIndex);
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentStepIndex, isOpen]);

  return <>{children}</>;
}
```

### Overlay Design

```
┌────────────────────────────────────────────────────┐  ← fixed inset-0 bg-black/60 z-[10000]
│                                                    │
│           ┌────────────────────────────┐           │
│           │  Step 3 of 9          [×]  │           │  ← bg-card border-border shadow-card
│           │                            │           │     max-w-[480px] w-[calc(100%-2rem)]
│           │   [Illustration / Icon]    │           │     rounded-[var(--radius-card)]
│           │                            │           │
│           │   Meet the Layout          │           │  ← text-foreground font-semibold
│           │   The sidebar gives you    │           │  ← text-muted-foreground text-sm
│           │   quick access to all      │           │
│           │   features. The chat       │           │
│           │   panel on the right can   │           │
│           │   be hidden at any time.   │           │
│           │                            │           │
│           │  ● ● ● ○ ○ ○ ○ ○ ○        │           │  ← filled dots = completed steps
│           │                            │           │
│           │  [Skip]  [← Back]  [Next→] │           │
│           └────────────────────────────┘           │
│                                                    │
└────────────────────────────────────────────────────┘
```

- z-index: `z-[10000]` — above `GlobalPopup` (`z-9999`) and all other layers
- Backdrop: `fixed inset-0 bg-black/60 flex items-center justify-center`
- Card:
  `bg-card border border-border rounded-[var(--radius-card)] shadow-card p-6 w-full max-w-[480px]`
- Step transition: `AnimatePresence mode="wait"` wraps `TourStepContent` with
  `key={currentStepIndex}`

```tsx
// Animation: enter from below (y: 8→0), exit upward (y: 0→-8)
// Matches existing ModalRoot pattern but with directional y offset for step sense of direction
<AnimatePresence mode='wait'>
  <motion.div
    key={currentStepIndex}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    <TourStepContent step={TOUR_STEPS[currentStepIndex]} />
  </motion.div>
</AnimatePresence>
```

> Import from `'motion/react'` (not `'framer-motion'`) — check existing imports
> in the codebase and match them.

### Spotlight — SVG Mask Approach

The SVG mask approach is preferred over `box-shadow` — it doesn't break stacking
contexts and supports smooth rect transitions:

```tsx
// features/virtual-tour/ui/TourSpotlight.tsx
'use client';
import { useEffect, useState } from 'react';

interface SpotlightProps {
  selector: string;
}

export function TourSpotlight({ selector }: SpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      requestAnimationFrame(() => {
        // avoid layout thrashing
        const el = document.querySelector(selector);
        setRect(el?.getBoundingClientRect() ?? null);
      });
    };
    update();
    const ro = new ResizeObserver(update);
    const el = document.querySelector(selector);
    if (el) ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [selector]);

  if (!rect) return null; // graceful fallback — no spotlight if element not found

  const { x, y, width, height } = rect;
  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden='true'
    >
      <defs>
        <mask id='tour-cutout'>
          <rect width='100%' height='100%' fill='white' />
          <rect
            x={x - 4}
            y={y - 4}
            width={width + 8}
            height={height + 8}
            rx={6}
            fill='black'
          />
        </mask>
      </defs>
      <rect
        width='100%'
        height='100%'
        fill='rgba(0,0,0,0.55)'
        mask='url(#tour-cutout)'
      />
    </svg>
  );
}
```

> **Jest setup**: Add `ResizeObserver` mock to `jest.setup.ts` (pattern: same as
> existing `IntersectionObserver` mock in project memory).

### Last Step (Google Calendar)

`attachCalendar()` returns a **URL string** — the caller must navigate. Before
triggering OAuth, save progress to backend, then redirect:

```tsx
// In TourControls — last step primary CTA handler
async function handleConnectCalendar() {
  // 1. Persist current step so tour resumes if OAuth aborts
  await saveTourProgress(currentStepIndex);
  // 2. Get OAuth URL from server action
  const oauthUrl = await attachCalendar();
  // 3. Full navigation — Zustand state is lost, but backend has the step saved
  globalThis.location.href = oauthUrl;
}
```

**Post-OAuth return recovery**: When Google redirects back, `TourProvider`
mounts fresh. It reads `isCompleted` (still `false`) and `initialStep` (= last
step index) from props and calls `open(initialStep)`. The tour shows the final
step again. On this re-open, the step can detect it's the last step and show a
"Complete" button instead of the OAuth button (e.g., via a `hasJustReturned`
signal or simply by calling `markTourComplete()` automatically if
`initialStep === TOUR_STEPS.length - 1`).

---

## Backend Changes Required

The backend currently has no onboarding state. All changes are in the backend
repo at `/Users/slavapopov/Documents/WandaAsk_backend`.

### 1. Migration

Follow the pattern of
`database/migrations/2026_02_25_153303_add_is_demo_to_users_table.php`:

```php
// database/migrations/YYYY_MM_DD_HHMMSS_add_onboarding_fields_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('onboarding_completed')->default(false)->after('is_demo');
    $table->unsignedTinyInteger('onboarding_last_step')->default(0)->after('onboarding_completed');
});
```

### 2. `app/Models/User.php`

```php
// $fillable — add:
'onboarding_completed',
'onboarding_last_step',

// casts() — add:
'onboarding_completed' => 'boolean',
'onboarding_last_step' => 'integer',
```

### 3. `app/Http/Requests/API/v1/UpdateUserProfileRequest.php`

```php
'onboarding_completed' => ['sometimes', 'boolean'],
'onboarding_last_step' => ['sometimes', 'integer', 'min:0'],
```

### 4. `app/Http/Resources/API/v1/UserResource.php` — `toArray()`

```php
'onboarding_completed' => $this->onboarding_completed,
'onboarding_last_step' => $this->onboarding_last_step,
```

### 5. `app/Services/User/UserProfileService.php`

Add handling for both new fields in the `update()` method (follow existing
`name` / `password` field pattern).

### Routes

No new routes. `PATCH /api/v1/users/me` already exists (routes/api.php line 98).

> `GET /api/v1/users/me` returns the raw Eloquent model (not UserResource) — new
> columns appear automatically once added to `$fillable`. The `PATCH` response
> uses `UserResource`, so step 4 is required to expose the fields there.

---

## Frontend API Layer

```ts
// features/virtual-tour/api/tour.ts
'use server';

import { httpClient } from '@/shared/lib/httpClient';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fire-and-forget — called with debounce from TourProvider, errors are swallowed
export async function saveTourProgress(lastStep: number): Promise<void> {
  await httpClient(`${API_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify({ onboarding_last_step: lastStep }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function markTourComplete(): Promise<void> {
  await httpClient(`${API_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify({ onboarding_completed: true }),
    headers: { 'Content-Type': 'application/json' },
  });
  revalidatePath('/dashboard');
}

export async function resetTour(): Promise<void> {
  await httpClient(`${API_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify({
      onboarding_completed: false,
      onboarding_last_step: 0,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  revalidatePath('/dashboard');
}
```

---

## Integration Points

### `app/dashboard/layout.tsx` (Server Component)

```tsx
// Add getMe() call — check if user data is already fetched for another component
// If <User /> self-fetches, add a parallel fetch here for onboarding fields only
const user = await getMe(); // GET /api/v1/users/me

// Pass to a new DashboardProviders client wrapper:
<DashboardProviders
  onboardingCompleted={user.onboarding_completed ?? false}
  onboardingLastStep={user.onboarding_last_step ?? 0}
>
  {children}
</DashboardProviders>;
```

> Currently `app/dashboard/layout.tsx` does NOT call `getMe()` — user data is
> self-fetched inside `<User />`. A new `getMe()` call must be added to layout
> to pass onboarding fields to `TourProvider`. Alternatively, `TourProvider` can
> fetch via a dedicated `getOnboardingStatus()` server action — but a
> layout-level fetch is preferable as it runs in parallel with other layout
> data.

### `app/Providers.tsx`

No changes needed — `TourProvider` lives in `DashboardProviders`
(dashboard-specific), not in the root `app/Providers.tsx`.

### Profile Page — `app/dashboard/profile/account/page.tsx`

Add `RestartTourSection` as a sibling below `<ProfileForm>` — no changes to
`ProfileForm.tsx` itself:

```tsx
// app/dashboard/profile/account/page.tsx
import { RestartTourSection } from '@/features/virtual-tour';

export default async function ProfileAccountPage() {
  const user = await getUser();
  return (
    <>
      <ProfileForm user={user} />
      <RestartTourSection />{' '}
      {/* client component, calls resetTour() + opens store */}
    </>
  );
}
```

---

## TypeScript Types

```ts
// features/virtual-tour/model/types.ts
export interface TourStep {
  id: string;
  title: string;
  description: string;
  route?: string;
  illustration?: React.ReactNode;
  spotlightSelector?: string;
  isLast?: boolean;
}

export interface TourState {
  isOpen: boolean;
  currentStepIndex: number;
  isSaving: boolean;
}

export interface TourActions {
  open: (startIndex?: number) => void;
  close: () => void;
  goNext: () => void;
  goBack: () => void;
  complete: () => void;
}
```

Extend `entities/user/model/types.ts`:

```ts
export interface UserProps {
  // ... existing fields ...
  onboarding_completed: boolean;
  onboarding_last_step: number;
}
```

---

## Accessibility

The tour card must use `role="dialog"` with proper ARIA attributes:

```tsx
<div
  role='dialog'
  aria-modal='true'
  aria-labelledby='tour-step-title'
  aria-describedby='tour-step-description'
>
  <h2 id='tour-step-title'>{step.title}</h2>
  <p id='tour-step-description'>{step.description}</p>
</div>
```

- `Esc` key → close tour (save progress first)
- `ArrowRight` / `ArrowLeft` → next / previous step
- Add `aria-live="polite"` on a visually-hidden span that announces step number
  changes to screen readers
- Focus is trapped inside the dialog while tour is open — add a `keydown`
  handler on the dialog container
- When tour closes, return focus to the element that was focused before the tour
  opened (use `useRef` to capture it)

---

## Performance Considerations

### 1. RSC Safety

Wrapping layout in a Client Component (`DashboardProviders`) does NOT break RSC
for `children`. Children passed as `props.children` from a Server Component
parent retain their RSC rendering — only components written directly inside the
Client Component's JSX become client-rendered. This is the standard Next.js App
Router pattern.

### 2. Lazy-load the Tour Overlay

Gate the tour overlay behind `next/dynamic` with `ssr: false` — users who
completed the tour incur zero bundle cost:

```tsx
// app/dashboard/DashboardProviders.tsx
import dynamic from 'next/dynamic';

const TourPortal = dynamic(
  () =>
    import('@/features/virtual-tour/ui/TourPortal').then((m) => m.TourPortal),
  { ssr: false, loading: () => null },
);

// Only render the portal if the tour is not yet completed
{
  !onboardingCompleted && <TourPortal />;
}
```

### 3. `saveTourProgress` — Debounce & Fire-and-Forget

- 600ms debounce in `TourProvider` via `useRef<setTimeout>` (shown in
  TourProvider code above)
- Call with `void` — never await in the UI path
- Errors are silently swallowed — lost progress is acceptable; blocking the tour
  UI is not

### 4. Spotlight — No Layout Thrashing

All `getBoundingClientRect()` calls are wrapped in `requestAnimationFrame()`
(shown in `TourSpotlight` code above). The `ResizeObserver` callback also
schedules via `rAF`. Never call `getBoundingClientRect()` in the render phase.

### 5. Zustand SSR Hydration

- Never read Zustand store state during render for SSR-sensitive values
- Auto-launch via `useEffect` in `TourProvider` (not in render) → hydration-safe
- Pass `isCompleted` / `initialStep` as props, not from the store

---

## Acceptance Criteria

### Functional

- [ ] Tour auto-launches for users with `onboarding_completed = false` after
      login
- [ ] Tour does NOT auto-launch for users with `onboarding_completed = true`
- [ ] Tour step counter shows "Step N of M" with correct totals
- [ ] Forward navigation moves to next step; `router.replace()` is called if
      `step.route` is set
- [ ] Back navigation returns to previous step
- [ ] Closing mid-tour saves current step index to backend (debounced 600ms)
- [ ] Reopening tour resumes from saved step (not step 1)
- [ ] Last step shows "Connect Google Calendar" and "Skip for now" buttons
- [ ] "Skip for now" marks `onboarding_completed = true` and closes tour
- [ ] "Connect Google Calendar" saves step to backend then performs full-page
      redirect to OAuth URL
- [ ] After OAuth redirect return, tour auto-resumes at the last step and
      completes
- [ ] "Restart Tour" on Profile page resets backend fields and opens tour from
      step 1
- [ ] `Esc` closes tour; `ArrowRight`/`ArrowLeft` navigate steps
- [ ] Tour card has `role="dialog"` and `aria-modal="true"`
- [ ] Tour overlay does not appear in SSR HTML (portal rendered client-only)

### Non-Functional

- [ ] Tour overlay `z-[10000]` — no z-index conflicts with existing UI layers
- [ ] `next/dynamic` lazy-loads the portal — zero bundle impact for
      completed-tour users
- [ ] No TypeScript `any` — all types fully defined
- [ ] Step config in `steps.ts` is pure data — adding a step requires no shell
      changes
- [ ] `saveTourProgress` is debounced and fire-and-forget — never blocks UI
- [ ] `getBoundingClientRect()` called only inside `requestAnimationFrame`
- [ ] Server Actions use `httpClient`, never raw `fetch`

### Quality Gates

- [ ] Unit tests: tour store actions (`open`, `goNext`, `goBack`, `complete`)
- [ ] Unit tests: `TourStepContent` renders title and description
- [ ] Unit tests: `TourProgress` shows correct filled dots
- [ ] Unit tests: `RestartTourSection` calls `resetTour` and opens store on
      click
- [ ] E2E: new user → tour auto-launches → complete all steps → tour does not
      relaunch on refresh
- [ ] E2E: close tour at step 3 → refresh → tour resumes at step 3
- [ ] E2E: Profile "Restart Tour" → tour opens at step 1
- [ ] `npm run lint` passes with no errors
- [ ] `fsd-boundary-guard` passes — no cross-feature imports

---

## Implementation Phases

### Phase 1 — Backend Foundation (backend repo)

1. Write migration for `onboarding_completed` + `onboarding_last_step`
2. Update `User.php`, `UserResource.php`, `UpdateUserProfileRequest.php`,
   `UserProfileService.php`
3. Verify with `backend-contract-validator` agent

### Phase 2 — Tour Shell (abstract component)

1. Create `features/virtual-tour/model/types.ts`
2. Create `features/virtual-tour/model/tour-store.ts`
3. Create `TourPortal.tsx` — `useSyncExternalStore` hydration guard +
   `createPortal`
4. Create `TourOverlay.tsx` — backdrop, card, `AnimatePresence`
5. Create `TourStepContent.tsx` — illustration slot, title, description
6. Create `TourControls.tsx` — Back / Next / Skip / Close buttons (last step
   variant)
7. Create `TourProgress.tsx` — dot indicators
8. Create `TourSpotlight.tsx` — SVG mask, `rAF`-guarded `getBoundingClientRect`

### Phase 3 — Step Definitions & Navigation

1. Create `features/virtual-tour/model/steps.ts` — all 9 steps with content +
   routes
2. Create `TourProvider.tsx` — auto-launch in `useEffect`, `router.replace` on
   step change, debounced `saveTourProgress`
3. Create `app/dashboard/DashboardProviders.tsx` — `'use client'` wrapper, lazy
   `TourPortal`
4. Update `app/dashboard/layout.tsx` — add `getMe()` call, render
   `<DashboardProviders>`
5. Update `entities/user/model/types.ts` — add `onboarding_completed`,
   `onboarding_last_step`

### Phase 4 — API & Persistence

1. Create `features/virtual-tour/api/tour.ts` — `saveTourProgress`,
   `markTourComplete`, `resetTour`
2. Wire `goNext` → `markTourComplete` on last step
3. Wire `close` → debounced `saveTourProgress`
4. Implement OAuth recovery: detect last-step re-entry, auto-complete

### Phase 5 — Profile Integration

1. Create `RestartTourSection.tsx` — calls `resetTour()` +
   `useTourStore.open(0)`
2. Add to `app/dashboard/profile/account/page.tsx`
3. Add `TOUR` or similar entry to `features/virtual-tour/index.ts` public API

### Phase 6 — Tests & Review

1. Unit tests (`unit-test-booster` agent)
2. E2E tests (`e2e-coverage-agent` agent)
3. Design audit (`design-guardian` agent)
4. Pre-commit full review (`mr-reviewer` agent)

---

## Edge Cases & Mitigations

| Edge Case                                                 | Mitigation                                                                                                                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User closes browser during Google OAuth                   | `saveTourProgress(lastStepIndex)` called BEFORE `location.href` redirect. On return, `initialStep` = last step, tour auto-resumes.                                          |
| `spotlightSelector` not in DOM (element not rendered yet) | `TourSpotlight` returns `null` — no spotlight shown, tour content still visible. No crash.                                                                                  |
| User presses browser Back during tour                     | `router.replace()` (not `push`) means the back stack is not polluted. The overlay persists in `DashboardProviders` which is above the route segment.                        |
| `saveTourProgress` network failure                        | Error silently swallowed (fire-and-forget). Progress re-attempted on the next step change. Lost progress = resume from slightly earlier step — acceptable.                  |
| Tour launched on small screens (< 1024px, no sidebar)     | Step 3 (layout intro) has no `spotlightSelector` for sidebar — copy explains sidebar is hidden on small screens. Card is `max-w-[480px] w-[calc(100%-2rem)]` — fits mobile. |
| User completes org/team creation before that tour step    | Step `onEnter` (if needed) can check current state and show "looks like you've already done this!" copy variant.                                                            |
| User navigates away manually mid-tour                     | Tour overlay stays open (it persists in layout). Next step's route navigation will bring them back to the correct page.                                                     |
| `ResizeObserver` not available in test environment        | Add mock to `jest.setup.ts` — same pattern as existing `IntersectionObserver` mock.                                                                                         |

---

## Dependencies & Risks

| Item                                         | Risk                                    | Mitigation                                                                           |
| -------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Backend migration                            | Blocks all frontend persistence         | Implement Phase 2 (shell) with `localStorage` shim first; swap to backend when ready |
| `getMe()` in `app/dashboard/layout.tsx`      | New fetch per dashboard page load       | Likely cached by Next.js fetch cache; use `cache: 'force-cache'` or `revalidate`     |
| `attachCalendar()` uses raw `fetch` (legacy) | Inconsistent with httpClient convention | Do not refactor in this PR — note as tech debt, call as-is                           |
| No new npm packages needed                   | —                                       | framer-motion, zustand, react-dom portals all already in bundle                      |

---

## Files to Create / Modify

### New files (frontend)

```
features/virtual-tour/
  api/tour.ts
  model/types.ts
  model/tour-store.ts
  model/steps.ts
  ui/TourPortal.tsx
  ui/TourOverlay.tsx
  ui/TourStepContent.tsx
  ui/TourControls.tsx
  ui/TourProgress.tsx
  ui/TourSpotlight.tsx
  ui/TourProvider.tsx
  ui/RestartTourSection.tsx
  index.ts
app/dashboard/DashboardProviders.tsx
```

### Modified files (frontend)

```
app/dashboard/layout.tsx               — add getMe() call + <DashboardProviders>
app/dashboard/profile/account/page.tsx — add <RestartTourSection>
entities/user/model/types.ts           — add onboarding_completed, onboarding_last_step
```

### Backend files (separate repo `/Users/slavapopov/Documents/WandaAsk_backend`)

```
database/migrations/YYYY_MM_DD_HHMMSS_add_onboarding_fields_to_users_table.php
app/Models/User.php
app/Http/Resources/API/v1/UserResource.php
app/Http/Requests/API/v1/UpdateUserProfileRequest.php
app/Services/User/UserProfileService.php
```

---

## References

### Internal codebase

- `shared/ui/modal/modal-root.tsx` — copy `useSyncExternalStore` hydration guard
  pattern verbatim
- `app/providers/ModalProvider.tsx` — provider pattern to follow for
  `TourProvider`
- `features/calendar/api/calendar.ts` — `attachCalendar()` returns URL string
  (not redirect) — caller does `location.href`
- `app/dashboard/layout.tsx` — three-column layout; currently no `getMe()` call
  here
- `entities/user/model/types.ts` — `UserProps` interface to extend with
  onboarding fields
- `shared/lib/httpClient.ts` — use for all `tour.ts` server actions
- `database/migrations/2026_02_25_153303_add_is_demo_to_users_table.php` —
  migration pattern to follow
- `shared/ui/button/Button.tsx` — Button variants: `primary`, `secondary`,
  `danger`, `ghostDanger`

### Design system tokens

- Card: `bg-card border border-border rounded-[var(--radius-card)] shadow-card`
- Primary CTA: `Button variant="primary"` (violet gradient)
- Secondary CTA: `Button variant="secondary"` (bordered)
- Close button: `ButtonClose` from `shared/ui/button/button-close.tsx`
- Backdrop: `fixed inset-0 bg-black/60`
- Step animation:
  `motion.div initial={{ opacity: 0, y: 8 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}`
- Import motion from whichever source existing components use (check codebase —
  may be `'framer-motion'` or `'motion/react'`)
