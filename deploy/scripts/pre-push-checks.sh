#!/usr/bin/env bash
# Pre-push checks: auto-fix → ESLint → TypeScript → Tests

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "")

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         Pre-push checks running          ║"
echo "╚══════════════════════════════════════════╝"
echo "  Branch : $BRANCH"
echo "  Commit : $COMMIT_HASH  $COMMIT_MSG"
echo ""

OVERALL_EXIT=0

# ── 0. Auto-fix (ESLint + Prettier) ─────────────────────────────────────────
echo "▶ Auto-fixing..."
./node_modules/.bin/eslint . --fix > /dev/null 2>&1 || true
./node_modules/.bin/prettier . --write --log-level silent > /dev/null 2>&1 || true

FIXED_FILES=$(git diff --name-only 2>/dev/null || true)
FIXED_COUNT=$(echo "$FIXED_FILES" | grep -c '\.' || true)

if [ -n "$FIXED_FILES" ] && [ "$FIXED_COUNT" -gt 0 ]; then
  echo "  ⚡ Auto-fixed ${FIXED_COUNT} file(s):"
  echo "$FIXED_FILES" | sed 's/^/     /'
  git add -u
  git commit -m "chore: auto-fix lint and format [pre-push]" --no-verify > /dev/null 2>&1
  echo "  ✅ Committed"
else
  echo "  ✅ Nothing to fix"
fi
echo ""

# ── 1. ESLint ────────────────────────────────────────────────────────────────
echo "▶ ESLint..."
LINT_EXIT=0
LINT_OUTPUT=$(./node_modules/.bin/eslint . 2>&1) || LINT_EXIT=$?

if [ $LINT_EXIT -eq 0 ]; then
  LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c " warning " || true)
  echo "  → ✅ passed (${LINT_WARNINGS} warnings)"
else
  echo "  → ❌ failed"
  echo "$LINT_OUTPUT" | grep " error " | head -20
  OVERALL_EXIT=1
fi
echo ""

# ── 2. TypeScript ────────────────────────────────────────────────────────────
if [ $OVERALL_EXIT -eq 0 ]; then
  echo "▶ TypeScript..."
  TYPECHECK_EXIT=0
  TYPECHECK_OUTPUT=$(./node_modules/.bin/tsc --project tsconfig.check.json --noEmit 2>&1) || TYPECHECK_EXIT=$?
  if [ $TYPECHECK_EXIT -eq 0 ]; then
    echo "  → ✅ passed"
  else
    echo "  → ❌ failed"
    echo "$TYPECHECK_OUTPUT" | head -30
    OVERALL_EXIT=1
  fi
  echo ""
fi

# ── 3. Tests ─────────────────────────────────────────────────────────────────
if [ $OVERALL_EXIT -eq 0 ]; then
  echo "▶ Tests..."
  TESTS_EXIT=0
  TESTS_OUTPUT=$(NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=4096" ./node_modules/.bin/jest --ci --passWithNoTests --runInBand 2>&1) || TESTS_EXIT=$?

  if [ $TESTS_EXIT -eq 0 ]; then
    TESTS_DETAIL=$(echo "$TESTS_OUTPUT" | grep -E "^Tests:|Test Suites:" | tail -2 | tr '\n' ' ' || echo "")
    echo "  → ✅ passed  ${TESTS_DETAIL}"
  else
    echo "  → ❌ failed"
    echo "$TESTS_OUTPUT"
    OVERALL_EXIT=1
  fi
  echo ""
fi

# ── Result ───────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════╗"
if [ $OVERALL_EXIT -eq 0 ]; then
  echo "║  ✅  All checks passed. Push allowed.    ║"
else
  echo "║  ❌  Checks failed. Push blocked.        ║"
fi
echo "╚══════════════════════════════════════════╝"
echo ""

exit $OVERALL_EXIT
