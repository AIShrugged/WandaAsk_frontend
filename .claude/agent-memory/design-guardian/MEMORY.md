# Design Guardian — Persistent Memory

## Components audited

- [Contrast audit 2026-03-13](./components-audited.md) — full WCAG AA audit of
  all shared/ui components: globals.css tokens, Button, Badge, Input, Textarea,
  InputDropdown, Error

## Confirmed design system patterns

- Cards use `rounded-[var(--radius-card)]`, buttons use
  `rounded-[var(--radius-button)]`
- Placeholder opacity: `/70` (not `/50`) — WCAG 1.4.3 exempts placeholder but
  /70 is best practice
- Badge on dark theme: never use `bg-green-50`, `bg-yellow-50` (light-theme
  colors)
- Dropdown highlight: `bg-accent/20` + `text-foreground` (not `bg-accent` which
  needs black text)
- Dropdown selected: `bg-primary/15` + `text-foreground` (violet tint, not
  green)

## Recurring issues

- `text-red-700` hardcoded anywhere — always use `text-destructive` token
  instead
- `/50` opacity on muted-foreground for placeholder — bump to `/70`
- Badge variants with light-bg colors (green-50, yellow-50) are wrong on dark
  theme
- `bg-accent` (terminal green) as interactive highlight needs
  `text-accent-foreground` (black), not `text-foreground` (white) — white on
  green = 1.84:1, critical fail
