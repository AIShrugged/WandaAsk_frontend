---
name: decompose
description: >
  Decompose an oversized or monolithic TypeScript/React file in the WandaAsk
  frontend into properly separated files following FSD conventions. Use this
  skill when a file exceeds 200 lines, contains multiple unrelated concerns, has
  inline sub-components that should be extracted, or when constants and types
  are mixed into component files. Trigger phrases: "split this file", "break
  this apart", "this file is too big", "extract components", "refactor into
  smaller files", "decompose", "this component does too much".
---

# Decompose — Split a Monolithic File

This skill extracts a large or multi-concern file into properly structured FSD
modules. The goal is files that each do one thing, are easy to test and reason
about, and reuse shared primitives rather than duplicating them.

## Step 1 — Analyze the target file

Read the file and identify:

1. **Visual sections**: each distinct UI region (header, list, empty state,
   modal, filter bar) becomes a candidate for extraction
2. **Inline maps**: a `items.map(item => <JSX>)` with a body > 10 lines →
   extract the body to `<name>-list-item.tsx`
3. **Inline modals/dialogs**: any `<Dialog>` or `<Modal>` usage where the
   trigger and the content are co-located → extract to `<action>-modal.tsx`
4. **Inline empty/loading states**: extract to `<name>-empty.tsx` and
   `<name>-skeleton.tsx`
5. **Constants**: string literals used more than once (status labels, color
   classes, route paths) → extract to `model/constants.ts`
6. **Types mixed with component code**: move to `types.ts` or `model/types.ts`
7. **Utility/helper functions** at the top of a component file → move to `lib/`
   or `shared/lib/`
8. **Generic UI pieces**: components that have no feature-specific knowledge (a
   colored badge, a user avatar row) → move to `shared/ui/`

## Step 2 — Plan the extraction

Before writing any code, list:

- Which files you will create and what each one contains
- Which imports will change and in which direction
- Whether any extracted pieces belong in `shared/` instead of the feature

Present this plan to the user as a short bullet list. Wait for confirmation
before making changes unless the task was framed as "just do it".

## Step 3 — Extract in dependency order

Extract leaf components first (the ones with no local imports), then the
containers that import them. This avoids import cycles mid-refactor.

1. Extract constants → `model/constants.ts`
2. Extract types → `types.ts` or `model/types.ts`
3. Extract list item / card → `<name>-list-item.tsx`
4. Extract empty state → `<name>-empty.tsx`
5. Extract skeleton → `<name>-skeleton.tsx`
6. Extract modals → `<action>-modal.tsx`
7. Update the original file to import the extracted pieces
8. Update `ui/index.ts` barrel exports

## Step 4 — Validate

After extraction:

- Each resulting file should be < 200 lines
- No circular imports
- The original component's public API (props interface, export name) must not
  change — callers must not need updating
- Run: `npm run lint:fix` to catch any import or naming issues

## Extraction patterns

### Extract a list item

```tsx
// Before — inline in list.tsx
{items.map(item => (
  <div key={item.id} className="...">
    <span>{item.name}</span>
    <Badge>{item.status}</Badge>
    <button onClick={() => onDelete(item.id)}>Delete</button>
  </div>
))}

// After — <name>-list-item.tsx
interface Props {
  item: ItemProps;
  onDelete: (id: number) => void;
}
export function NameListItem({ item, onDelete }: Props) { ... }

// list.tsx becomes:
{items.map(item => (
  <NameListItem key={item.id} item={item} onDelete={onDelete} />
))}
```

### Extract constants

```ts
// Before — magic strings scattered in JSX
<span className={status === 'open' ? 'text-blue-400' : 'text-green-400'}>
  {status === 'open' ? 'Open' : 'Closed'}
</span>

// After — model/constants.ts
export const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  closed: 'Closed',
};
export const STATUS_COLORS: Record<Status, string> = {
  open: 'text-blue-400',
  closed: 'text-green-400',
};

// Component:
<span className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</span>
```

### Extract a modal

```tsx
// Before — trigger + dialog content in same component

// After — delete-item-modal.tsx
interface Props {
  itemId: number;
  onConfirm: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function DeleteItemModal({ itemId, onConfirm, open, onOpenChange }: Props) { ... }
```

## Size targets after extraction

| File type      | Target max lines |
| -------------- | ---------------- |
| Page component | 150              |
| List component | 100              |
| List item      | 80               |
| Form component | 150              |
| Modal          | 100              |
| Empty/skeleton | 40               |
| constants.ts   | unlimited        |
| types.ts       | unlimited        |

These are targets, not hard limits — a complex form may legitimately be 200+
lines. The rule is: if a reviewer would say "this does too much", split it.
