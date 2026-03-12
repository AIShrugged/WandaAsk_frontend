---
status: pending
priority: p1
issue_id: '001'
tags: [code-review, security]
---

# ENV files with real backend URLs committed to git

## Problem Statement

`.env.development` and `.env.production` are tracked by git and contain real API
base URLs:

- `.env.development`: `API_URL=https://dev-api.shrugged.ai/api/v1`
- `.env.production`: `API_URL=https://spodial-hr-backend.fabitdev.ru/api/v1`

Neither file appears in `.gitignore`. This exposes real backend hostnames to
anyone with repo access.

## Findings

- `git status` shows `M .env.development` — file is tracked
- `.gitignore` has no `.env*` pattern
- Production API endpoint is in git history

**Impact:** Any developer or attacker with repo access can query backend
directly. Combined with leaked/weak auth token → data access.

## Proposed Solutions

### Option A: Add to .gitignore + delete from history (Recommended)

1. Add to `.gitignore`: `.env.development`, `.env.production`, `.env*.local`
2. Create `.env.example` with placeholder values
3. Run `git rm --cached .env.development .env.production`
4. If files were ever pushed to remote: use `git filter-repo` to purge history

**Pros:** Complete fix. **Cons:** Requires coordinating team to re-create local
env files. **Effort:** Small. **Risk:** Low.

### Option B: Keep in git with placeholder values

Replace real URLs with `https://your-backend.example.com` and commit.

**Pros:** Simple. **Cons:** Doesn't fix existing history if URLs were ever
pushed. Doesn't solve the root pattern. **Effort:** Small. **Risk:** Low.

## Acceptance Criteria

- [ ] `.env.development` and `.env.production` added to `.gitignore`
- [ ] `.env.example` created with placeholder values
- [ ] Files removed from git tracking (`git rm --cached`)
- [ ] Git history audited — if URLs were pushed to remote, purge with
      filter-repo

## Affected Files

- `.gitignore`
- `.env.development`
- `.env.production`
