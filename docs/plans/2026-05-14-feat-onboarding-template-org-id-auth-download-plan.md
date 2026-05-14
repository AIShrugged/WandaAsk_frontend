---
title:
  'feat: Onboarding — template field, organization_id on upload, authenticated
  download'
type: feat
status: completed
date: 2026-05-14
---

# feat: Onboarding — template field, organization_id on upload, authenticated download

## Enhancement Summary

**Deepened on:** 2026-05-14 **Research agents used:**
kieran-typescript-reviewer, security-sentinel, code-simplicity-reviewer,
architecture-strategist, julik-frontend-races-reviewer, performance-oracle,
feasibility-reviewer, scope-guardian-reviewer, pattern-recognition-specialist,
best-practices-researcher, learnings-researcher

### Key Improvements from Research

1. **Use existing `Pill` component** — `shared/ui/common/pill.tsx` already
   implements the exact toggle chip pattern needed. The plan's raw `<button>`
   approach is non-standard; `Pill` must be used instead.
2. **Add `aria-pressed` to `Pill`** — The existing `Pill` component does not
   forward `aria-pressed`. A one-line fix is required there before the template
   chip can be accessible.
3. **`TemplateValue` in `types.ts` as plain union** — The existing codebase
   pattern is plain unions in `types.ts`, not Zod-inferred. `DraftStatus`,
   `TaskType` follow this. Do not add a standalone `TemplateSchema` just for
   type inference.
4. **`inputState.template !== null` guard, not truthiness** — `!== null` is the
   correct null-check for an optional enum field. Truthiness spread fails if
   future values are falsy.
5. **Explicit reducer guard fix** — Use `withInputState()` helper (already in
   `wizard-reducer.ts`), not a custom `!('inputState' in state)` guard.
6. **Race condition: template chip → generate** — A real race exists where
   `handleGenerate` can fire before `SET_TEMPLATE` re-renders. Snapshot
   `template` atomically in the dispatch.
7. **`organizationId` prop drilling concern** — Architecture agent flags that
   `OnboardingInputStep` should not hold `orgId` for a child it doesn't use.
   Resolved by confirming `organization_id` is genuinely required by the new
   backend contract, but the Server Action could alternatively read it from
   server context.
8. **Submit guard review** — Current guard requires non-empty description.
   Backend accepts nullable description, so a template-only submission is
   technically valid. This is a product decision gap.
9. **`httpClient` already handles JSON parse safety** — The documented learning
   (`server-action-html-response-json-parse.md`) does not apply here:
   `httpClient` already reads error responses as text before any JSON parse.
10. **Backend IDOR risk on `organization_id`** — `StoreOrphanAttachmentRequest`
    only validates `exists:organizations,id`, NOT org membership. This is a
    backend concern but should be noted.

---

## Overview

Three backend changes from the `feat/onboarding-improvements` PR (merged
2026-05-14) must be reflected in the frontend:

1. **`template` field** — new `nullable` field accepted by both
   `generate-structure` and `accept-structure`, with
   `Organization::TEMPLATES = ['IT']` as the only current value. Must be added
   to types, payloads, wizard state, and a UI selector in `OnboardingInputStep`.
2. **`organization_id` on pending attachment upload** —
   `StoreOrphanAttachmentRequest` now accepts `organization_id` (nullable
   integer). Without it the attachment is not scoped to an organization, so the
   LLM cannot see the file. The wizard already knows `orgId` — it must be
   forwarded to `uploadPendingAttachment`.
3. **Authenticated download only** — the signed-URL route no longer exists. The
   only valid route is `GET /v1/attachments/{id}/download` (now routed to
   `downloadAuthenticated`) — confirmed by `routes/api.php` line 235. No
   download URL is currently used in the frontend, so this item is
   **verification-only**.

---

## Backend Contract (verified against source)

### `StoreOrphanAttachmentRequest` (latest HEAD)

```php
// app/Http/Requests/API/v1/StoreOrphanAttachmentRequest.php
'file'            => ['required', 'file', 'max:10240'],
'upload_token'    => ['required', 'regex:/^[0-9a-f]{8}-…/'],
'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
```

> ⚠️ **Security note (backend):** `StoreOrphanAttachmentRequest::authorize()`
> only checks `$this->user() !== null`. It does not verify the user is a member
> of the supplied `organization_id`. The frontend sends the org ID from the
> server-rendered prop (not user input), so the risk is low in practice, but a
> backend policy gate on org membership should be added to `storePending` to
> prevent IDOR.

### `GenerateOrganizationStructureRequest`

```php
'description'  => ['nullable', 'string', 'max:10000'],
'upload_token' => ['nullable', 'string', 'regex:…'],
'links'        => ['nullable', 'array', 'max:5'],
'template'     => ['nullable', Rule::in(Organization::TEMPLATES)], // ['IT']
```

### `AcceptOrganizationStructureRequest`

```php
'organization.name'        => ['required', …],
'organization.description' => ['required', …],
'goals'                    => ['required', 'array', …],
'template'                 => ['nullable', Rule::in(Organization::TEMPLATES)],
'team'                     => ['nullable', 'array', …],
```

### `acceptStructure` response additions

Backend `OnboardingController::accept` now includes `template` in the
`$organization->refresh()->only(…)` array. The `AcceptStructureResponse`
interface is missing `template`. Verify whether any consumer reads `template`
from the accept response before adding it — if nothing reads it, omit the field
from the interface (YAGNI).

### Download route

```php
// routes/api.php line 235
Route::get('attachments/{attachment}/download', [IssueAttachmentController::class, 'downloadAuthenticated'])
    ->name('attachments.download.auth');
```

No unauthenticated signed-URL route exists. All downloads require
`Authorization: Bearer <token>`.

---

## Affected Files

| File                                                | Change                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `features/onboarding/model/types.ts`                | Add `TemplateValue` type + `template` to `InputState`, payloads, response  |
| `features/onboarding/model/wizard-reducer.ts`       | Add `template: null` to `EMPTY_INPUT`, add `SET_TEMPLATE` action + handler |
| `features/onboarding/api/attachments.ts`            | Accept and forward `organizationId`                                        |
| `features/onboarding/ui/onboarding-input-step.tsx`  | Add template chip UI using `Pill` + new props                              |
| `features/onboarding/ui/onboarding-wizard.tsx`      | Pass `template` to both payloads; pass `orgId` down; wire `SET_TEMPLATE`   |
| `features/onboarding/ui/onboarding-file-upload.tsx` | Accept and pass `organizationId` to `uploadPendingAttachment`              |
| `shared/ui/common/pill.tsx`                         | Add `aria-pressed={active}` to the inner `<button>` element                |

> **Not changed:** `features/onboarding/model/schemas.ts` — no new Zod schema
> needed for `TemplateValue` (plain type is sufficient; no runtime validation of
> user input occurs in this flow). `features/onboarding/api/onboarding.ts` — no
> code change needed; `JSON.stringify(payload)` already serializes any new
> fields once the payload types are updated.

---

## Implementation Plan

### Step 0 — Fix `Pill` component for accessibility

**File:** `shared/ui/common/pill.tsx`

Add `aria-pressed` to the `<button>` element so screen readers can announce the
selected state:

```tsx
// Before (existing)
<button type='button' onClick={onClick} className={…}>

// After
<button
  type='button'
  aria-pressed={active}   // ← add this
  onClick={onClick}
  className={…}
>
```

This is a one-line change and a prerequisite for Step 7. It also benefits any
future use of `Pill` as a toggle control.

**Research insight:** WCAG 2.1 SC 4.1.2 requires toggle buttons to expose their
pressed state via `aria-pressed`. Screen readers announce "IT, toggle button,
pressed" vs "not pressed" — without this attribute the selected state is
invisible to assistive technology.

---

### Step 1 — Types (`features/onboarding/model/types.ts`)

**1a. Add `TemplateValue` type:**

```typescript
// Single source of truth — mirrors Organization::TEMPLATES
// Plain union per project convention (DraftStatus, TaskType follow the same pattern)
export type TemplateValue = 'IT';
```

> **Convention:** Do NOT define `TemplateValue` via
> `z.infer<typeof TemplateSchema>` in `schemas.ts`. The project pattern
> (confirmed by `DraftStatus`, `TaskType`) is: domain types live as plain unions
> in `types.ts`, Zod schemas in `schemas.ts` mirror them. Inverting this couples
> the type system to the validation layer.

**1b. Add `template` to `InputState`:**

```typescript
export interface InputState {
  description: string;
  uploadToken: string | null;
  links: string[];
  attachments: PendingAttachment[];
  template: TemplateValue | null; // ← add
}
```

**1c. Add `template` to `GenerateStructurePayload`:**

```typescript
export interface GenerateStructurePayload {
  description?: string;
  upload_token?: string;
  links?: string[];
  template?: TemplateValue; // ← add
}
```

**1d. Add `template` to `AcceptStructurePayload`:**

```typescript
export interface AcceptStructurePayload {
  organization: { name: string; description: string };
  goals: Array<{ … }>;
  team?: Array<{ … }>;
  template?: TemplateValue;          // ← add
}
```

**1e. Optionally add `template` to `AcceptStructureResponse`:**

```typescript
export interface AcceptStructureResponse {
  id: number;
  name: string;
  slug: string;
  context: string;
  onboarded_at: string;
  template: TemplateValue | null; // ← add only if something reads it
}
```

> Before adding:
> `grep -rn "AcceptStructureResponse\|result\.data\." features/onboarding/` to
> confirm whether the `template` field from the accept response is actually
> consumed. The wizard currently calls `router.push(...)` immediately after
> success with no use of `result.data`. If nothing reads it, omit the field
> (YAGNI).

---

### Step 2 — Wizard reducer (`features/onboarding/model/wizard-reducer.ts`)

**2a. Update `EMPTY_INPUT` — required, build will fail without this:**

```typescript
export const EMPTY_INPUT: InputState = {
  description: '',
  uploadToken: crypto.randomUUID(),
  links: [],
  attachments: [],
  template: null, // ← add
};
```

> Also audit `buildInitialState` — every branch that constructs `InputState`
> inline (not via `EMPTY_INPUT` spread) must add `template: null`. Missing even
> one branch causes a TypeScript error.

**2b. Add `SET_TEMPLATE` action:**

```typescript
// In WizardAction union:
| { type: 'SET_TEMPLATE'; value: TemplateValue | null }
```

**2c. Handle the action using `withInputState` (the existing helper):**

```typescript
case 'SET_TEMPLATE': {
  return withInputState(state, { ...inputState, template: action.value });
}
```

> **Do NOT use** `if (!('inputState' in state)) return state`. The
> `withInputState` helper (already in `wizard-reducer.ts`) handles that guard
> uniformly. The custom guard would be inconsistent with every other
> `inputState`-mutating case in the file.

---

### Step 3 — Attachment API (`features/onboarding/api/attachments.ts`)

Add `organizationId` parameter and include it in the FormData:

```typescript
export async function uploadPendingAttachment(
  file: File,
  uploadToken: string,
  organizationId: number,            // ← add (backend: nullable integer, exists:organizations,id)
): Promise<ActionResult<IssueAttachment>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_token', uploadToken);
    formData.append('organization_id', String(organizationId)); // ← add

    const { data } = await httpClient<IssueAttachment>(
      `${API_URL}/attachments/pending`,
      { method: 'POST', body: formData },
    );
    …
  }
}
```

> **Call site audit:** Before making `organizationId` required, run
> `grep -rn "uploadPendingAttachment" features/ app/ widgets/` to confirm the
> onboarding file upload component is the only caller. If other callers exist
> (e.g., issue attachment upload), use `organizationId?: number` (optional) to
> stay compatible.
>
> **Download note:** Confirm `grep -rn "download" features/ shared/` returns 0
> hits (already verified). Document in a comment that the only download endpoint
> is `GET /api/v1/attachments/{id}/download` with
> `Authorization: Bearer <token>`.
>
> **JSON parse safety:** `httpClient` already reads error responses as `text()`
> before any JSON parse — the `server-action-html-response-json-parse.md`
> learning does not require additional handling here.

---

### Step 4 — Onboarding API (`features/onboarding/api/onboarding.ts`)

No code changes needed. The payload is typed as `GenerateStructurePayload` /
`AcceptStructurePayload` and serialized via `JSON.stringify(payload)`. Once Step
1 adds `template?: TemplateValue` to those interfaces, the existing
serialization automatically includes the field when set.

**Verify after Step 1:** `npm run build` on this file should produce no errors.

---

### Step 5 — File upload component (`features/onboarding/ui/onboarding-file-upload.tsx`)

Add `organizationId: number` prop and forward it to `uploadPendingAttachment`:

```typescript
interface Props {
  uploadToken: string;
  attachments: PendingAttachment[];
  organizationId: number; // ← add
  onUploaded: (attachment: PendingAttachment) => void;
  onDeleted: (attachmentId: number) => void;
  onPendingChange: (hasPending: boolean) => void;
}
```

Inside the upload handler:

```typescript
const result = await uploadPendingAttachment(file, uploadToken, organizationId);
//                                                              ^^^^^^^^^^^^^^
```

> **Performance note:** If `OnboardingFileUpload` is non-trivial in rendering
> complexity, wrapping it in `React.memo` prevents unnecessary re-renders when
> the parent re-renders due to `SET_TEMPLATE` state changes (since
> `organizationId` and other props won't change when template is toggled).

---

### Step 6 — Input step UI (`features/onboarding/ui/onboarding-input-step.tsx`)

**6a. Update Props interface:**

```typescript
interface Props {
  state: InputState;
  needsInfoData?: NeedsInfoData;
  isSubmitting: boolean;
  hasFilePending: boolean;
  template: TemplateValue | null; // ← add
  organizationId: number; // ← add (for file upload)
  onTemplateChange: (v: TemplateValue | null) => void; // ← add
  onDescriptionChange: (value: string) => void;
  // … existing props unchanged
}
```

**6b. Add a `TEMPLATE_OPTIONS` constant — at module level, not inside the
component:**

```typescript
// Mirrors Organization::TEMPLATES on the backend
// Update this array when the backend adds new templates
const TEMPLATE_OPTIONS: Array<{ value: TemplateValue; label: string }> = [
  { value: 'IT', label: 'IT' },
];
```

> **Architecture note:** The architecture reviewer recommends moving
> `TEMPLATE_OPTIONS` to the model layer (`model/wizard-reducer.ts` or a new
> `model/template-options.ts`). This is sound for large, shared label maps.
> However, given this is a single-entry list used only by this component,
> defining it at the top of the component file is acceptable and avoids
> premature abstraction. Revisit if a second component needs to render template
> labels.

**6c. Template selector UI — use the existing `Pill` component:**

Import `Pill` from `@/shared/ui/common` (already exported from the index). Place
the section **between the Description textarea and the Links section**.

```tsx
import { Pill } from '@/shared/ui/common';

{
  /* Template selector */
}
<div className='flex flex-col gap-2'>
  <span className='text-sm font-medium text-foreground'>Industry template</span>
  <div className='flex flex-wrap gap-2'>
    {TEMPLATE_OPTIONS.map((t) => (
      <Pill
        key={t.value}
        active={template === t.value}
        onClick={() => onTemplateChange(template === t.value ? null : t.value)}
      >
        {t.label}
      </Pill>
    ))}
  </div>
</div>;
```

> **Accessibility:** After Step 0 adds `aria-pressed` to `Pill`, this chip will
> satisfy WCAG 2.1 SC 4.1.2. Wrap the chip group in `<fieldset>` + `<legend>`
> for full compliance:
>
> ```tsx
> <fieldset className='border-none p-0 m-0 flex flex-col gap-2'>
>   <legend className='text-sm font-medium text-foreground'>
>     Industry template
>   </legend>
>   <div className='flex flex-wrap gap-2'>…</div>
> </fieldset>
> ```
>
> `<fieldset>/<legend>` provides the group label that screen readers announce
> before each chip. Do NOT add `role="group"` inside `<fieldset>` — it doubles
> the announcement.

**6d. Pass `organizationId` to `OnboardingFileUpload`:**

```tsx
{
  state.uploadToken && (
    <OnboardingFileUpload
      uploadToken={state.uploadToken}
      attachments={state.attachments}
      organizationId={organizationId} // ← add
      onUploaded={onUploaded}
      onDeleted={onDeleted}
      onPendingChange={onPendingChange}
    />
  );
}
```

**6e. Submit guard — product decision:**

The current guard requires `!state.description.trim()`. The backend accepts
`nullable` description, meaning a template-only submission is technically valid.
Decide before implementing:

- **Keep as-is** → description remains required; template is an enhancement
- **Relax guard** →
  `disabled={isSubmitting || hasFilePending || (!state.description.trim() && !template)}`
  → either description or template is sufficient

Neither is wrong. Document the decision in the PR.

---

### Step 7 — Wizard (`features/onboarding/ui/onboarding-wizard.tsx`)

**7a. Pass `template` into `handleGenerate` payload — use `!== null`, not
truthiness:**

```typescript
const payload = {
  description: inputState.description.trim(),
  ...(inputState.template !== null && { template: inputState.template }), // ← !== null
  ...(inputState.uploadToken &&
    inputState.attachments.length > 0 && {
      upload_token: inputState.uploadToken,
    }),
  ...(inputState.links.some(Boolean) && {
    links: inputState.links.filter(Boolean),
  }),
};
```

> **Why `!== null` not `&&`:** The truthiness spread
> `...(value && { key: value })` fails if any future `TemplateValue` is a falsy
> string (empty string, `'0'`, etc.). Explicit `!== null` is the correct guard
> for a nullable enum field.

**7b. Pass `template` into `handleAccept` payload:**

```typescript
const payload = {
  organization: {
    name: orgName,
    description: previewData.organization.description,
  },
  goals: previewData.goals.map(…),
  team: teamPayload,
  ...(inputState.template !== null && { template: inputState.template }), // ← add
};
```

> `inputState` is available at line 89 of `onboarding-wizard.tsx` and is in
> scope for `handleAccept`.

**7c. Race condition mitigation — template chip → generate:**

A real race exists: user clicks the IT chip, then immediately clicks "Generate
structure" before React re-renders. `handleGenerate` closes over the previous
render's `inputState` where `template` is still `null`.

The simplest fix is to **snapshot the current reducer state in the dispatch**.
The reducer already provides the latest `inputState` synchronously — read it
from the current state at call time, not from a stale closure:

```typescript
async function handleGenerate() {
  if (isSubmitting || hasFilePending) return;

  // Read current state directly to avoid stale closure on template
  const currentInput = 'inputState' in state ? state.inputState : EMPTY_INPUT;

  const payload = {
    description: currentInput.description.trim(),
    ...(currentInput.template !== null && { template: currentInput.template }),
    …
  };
  …
}
```

> Alternatively, the `GENERATE_STARTED` action could carry the full payload as a
> field so the reducer snapshots it atomically — but the above inline read is
> simpler and sufficient.

**7d. Wire new props to `OnboardingInputStep`:**

```tsx
<OnboardingInputStep
  state={inputState}
  needsInfoData={needsInfoData}
  isSubmitting={isSubmitting}
  hasFilePending={hasFilePending}
  template={inputState.template}                                    // ← add
  organizationId={orgId}                                            // ← add
  onTemplateChange={(value) => dispatch({ type: 'SET_TEMPLATE', value })}  // ← add
  onDescriptionChange={(value) => dispatch({ type: 'SET_DESCRIPTION', value })}
  {/* … all existing props unchanged … */}
/>
```

This renders for both `input` and `needs_info` steps (same render path at bottom
of wizard).

---

## Acceptance Criteria

- [x] `POST /generate-structure` body includes `"template": "IT"` when the chip
      is selected, and omits the field entirely when null.
- [x] `POST /accept-structure` body includes `"template": "IT"` when template
      was selected during the input step.
- [x] `POST /attachments/pending` body includes `organization_id` matching the
      current org.
- [ ] File uploaded during onboarding is associated with the org on the backend
      (verify via backend log or `organization_id` column on
      `issue_attachments`).
- [x] No reference to an unauthenticated signed download URL exists anywhere in
      the frontend (`grep -rn "download" features/ shared/` → 0 relevant hits).
- [x] `Pill` chip renders correctly: deselected = ghost border, selected = solid
      primary fill.
- [x] `Pill` chip exposes `aria-pressed="true"` when selected,
      `aria-pressed="false"` when not.
- [x] Deselecting the chip (clicking again) sends no `template` field in the
      payload.
- [x] Template selection persists across `needs_info → processing → preview`
      transitions.
- [x] Template selection persists when user clicks "Back" from preview to input.
- [x] TypeScript compiles without errors (`npm run build`).
- [x] ESLint passes without new errors (`npm run lint`).
- [x] Existing tests continue to pass (`npm test -- --ci --passWithNoTests`).

---

## Edge Cases

- **`needs_info` step**: Template in `inputState` survives the
  `needs_info → processing → preview` transition automatically —
  `withInputState` propagates `inputState` intact through every step transition
  in the reducer.
- **Draft resume on page reload**: `buildInitialState` initializes from
  `initialDraft`. The backend draft does not store `template` (it is a
  generation hint). On resume, `template` defaults to `null`. Acceptable —
  template is only relevant for generation, not preview/accept. If persistence
  across reloads is required, use `localStorage` (see
  `2026-05-13-fix-onboarding-skip-and-ux-improvements-plan.md`).
- **Future templates**: `TEMPLATE_OPTIONS` constant and `TemplateValue` union
  are the only two places to update when the backend adds new values.
- **`hasFilePending` invariant**: `OnboardingFileUpload` unmounts during
  `step: 'processing'`. Any upload that was in-flight when generate fires would
  leave an orphaned pending entry. The `hasFilePending` guard in
  `handleGenerate` is load-bearing, not cosmetic — do not remove it.
- **Concurrent uploads in React 19**: Next.js serialises concurrent Server
  Actions from the same client, so two parallel file uploads queue correctly.
  Both write to the same `upload_token` — the backend `upload_token` uniqueness
  is the authoritative guard.

---

## References

### Internal

- `features/onboarding/model/types.ts` — current types (missing `template`)
- `features/onboarding/api/attachments.ts` — upload action (missing
  `organization_id`)
- `features/onboarding/api/onboarding.ts` — generate/accept actions (no change
  needed)
- `features/onboarding/ui/onboarding-wizard.tsx` — handles both payloads, owns
  `orgId`
- `features/onboarding/ui/onboarding-input-step.tsx` — UI for step 1
- `features/onboarding/ui/onboarding-file-upload.tsx` — file upload widget
- `shared/ui/common/pill.tsx` — existing toggle chip component (needs
  `aria-pressed` added)
- `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — learning: `httpClient` already handles this; no additional wrapping needed

### Backend (verified)

- `app/Http/Requests/API/v1/StoreOrphanAttachmentRequest.php:27` —
  `organization_id` validation
- `app/Http/Requests/API/v1/GenerateOrganizationStructureRequest.php` —
  `template` validation
- `app/Http/Requests/API/v1/AcceptOrganizationStructureRequest.php` — `template`
  validation
- `app/Models/Organization.php` — `TEMPLATES = ['IT']`
- `routes/api.php:235` — authenticated download route (no signed URL)

### Related Plans

- `docs/plans/2026-05-12-feat-organization-onboarding-wizard-plan.md` — original
  wizard design
- `docs/plans/2026-05-13-refactor-onboarding-wizard-conventions-plan.md` —
  reducer architecture
- `docs/plans/2026-05-13-fix-onboarding-skip-and-ux-improvements-plan.md` —
  localStorage patterns
