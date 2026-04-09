---
name: Components Audited
description:
  Record of all components and files that have been audited and what was
  found/fixed
type: project
---

## Contrast Audit — 2026-03-13

**Files audited:** globals.css, Button.tsx, button-icon.tsx, Input.tsx,
InputDropdown.tsx, textarea.tsx, Checkbox.tsx, Badge.tsx, Error.tsx,
InputPassword.tsx, button-close.tsx, button-back.tsx, button-copy.tsx,
H1/H2/H3/H4.tsx

### Fixes applied

| File                                | Issue                                                                   | Fix                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `globals.css`                       | `--destructive: 0 70% 55%` + white text = 4.20:1 (FAIL)                 | Darkened to `0 70% 49%` → 5.13:1                                         |
| `globals.css`                       | `--muted-foreground: 240 8% 52%` on muted bg = 4.41:1 (borderline FAIL) | Bumped to `240 8% 56%` → 5.11:1                                          |
| `shared/ui/input/Error.tsx`         | `text-red-700` on dark background = 3.18:1                              | Changed to `text-destructive` (now 5.13:1 after token fix)               |
| `shared/ui/badge/Badge.tsx`         | `bg-primary/10 text-primary` = 2.74:1                                   | Changed to `text-violet-300` → 9.53:1                                    |
| `shared/ui/badge/Badge.tsx`         | `bg-green-50 text-green-700` — light-theme colors on dark theme         | Changed to `bg-accent/15 text-emerald-400` → 4.62:1                      |
| `shared/ui/badge/Badge.tsx`         | `bg-yellow-50 text-yellow-700` — light-theme colors on dark theme       | Changed to `bg-yellow-500/15 text-yellow-300` → 5.92:1                   |
| `shared/ui/badge/Badge.tsx`         | `bg-destructive/10 text-destructive` = 3.30:1                           | Changed to `text-red-400` → 5.53:1                                       |
| `shared/ui/input/Input.tsx`         | `placeholder-muted-foreground/50` = 2.08:1                              | Changed to `/70` → 3.27:1 (placeholder exemption applies per WCAG 1.4.3) |
| `shared/ui/input/textarea.tsx`      | `placeholder-muted-foreground/50` = 2.08:1                              | Changed to `/70`                                                         |
| `shared/ui/input/InputDropdown.tsx` | `text-muted-foreground/50` placeholder = 2.08:1                         | Changed to `/70`                                                         |
| `shared/ui/input/InputDropdown.tsx` | `bg-accent` highlight + `text-foreground` = 1.84:1 (CRITICAL FAIL)      | Changed to `bg-accent/20` for hover, `bg-primary/15` for selected        |
| `shared/ui/input/InputDropdown.tsx` | `Check` icon `text-primary` on `primary/15` bg = 2.50:1                 | Changed to `text-violet-300` → 8.69:1                                    |

### Items that pass without changes

- `foreground` on `background`: 17.42:1
- `foreground` on `card`: 16.44:1
- Primary button (white on violet gradient): 4.62–8.15:1
- Secondary button (foreground on background): 17.42:1
- Secondary button hover (black on accent green): 9.65:1
- Danger button (white on destructive): 5.13:1 (after token fix)
- Badge default (secondaryFg on secondary): 8.93:1
- Sidebar accent: 7.28:1
- ButtonIcon muted default: 4.97:1 (passes 3:1 UI threshold)
- All H1-H4 headings use `text-foreground`: pass
- Error.tsx `role="alert" aria-live="polite"`: accessibility attrs intact

### Notes for future audits

- Placeholder text: WCAG 1.4.3 Note 1 explicitly exempts placeholder text from
  contrast requirements. Our /70 opacity is a best-practice improvement, not
  strictly required. Do not chase 4.5:1 for placeholder — it would make
  placeholder indistinguishable from real input text.
- `badge.success` and `badge.warning` had light-theme bg-green-50/bg-yellow-50
  which are completely wrong on dark theme. Fixed to dark-theme-compatible
  variants.
- `ButtonIcon` has no focus-visible ring — medium issue, not a contrast issue.
