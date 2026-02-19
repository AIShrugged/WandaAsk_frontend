---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, architecture]
---

# Delete `tailwind.config.js` — inert in v4 pipeline, misleading artifact

## Problem Statement

`tailwind.config.js` is a Tailwind v3 format config file. The project uses `@tailwindcss/postcss` (v4 pipeline) with `@theme` in `globals.css` as the authoritative config. The `tailwind.config.js` file is never read by the v4 pipeline.

Risks:
- VS Code Tailwind IntelliSense may read it and show wrong completions
- CI/CD changes that revert to v3 postcss would pick it up silently
- New developers may edit it expecting it to work

The comment in the file says it is for reference only, but its presence is still misleading.

## Proposed Solution

Delete `tailwind.config.js`. Any documentation value it provides can be replaced with a comment in `globals.css` in the `@theme` block.

**Effort:** Trivial. **Risk:** None (file is already inert).

## Acceptance Criteria
- [ ] `tailwind.config.js` deleted
- [ ] `globals.css` has a comment documenting the breakpoint strategy
- [ ] Build passes after deletion

## Affected Files
- `tailwind.config.js` (delete)
- `app/globals.css` (add comment if needed)
