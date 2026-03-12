#!/usr/bin/env bash
# Pre-push checks with Telegram notifications
# Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from .env.local (optional)
# If no Telegram config → checks still run, notification is skipped

set -euo pipefail

# ── Ensure we're in the repo root ──────────────────────────────────────────
cd "$(git rev-parse --show-toplevel)"

# ── Load Telegram credentials from .env.local ──────────────────────────────
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

if [ -f ".env.local" ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    case "$key" in
      "#"*|"") continue ;;
    esac
    case "$key" in
      TELEGRAM_BOT_TOKEN) TELEGRAM_BOT_TOKEN="$value" ;;
      TELEGRAM_CHAT_ID)   TELEGRAM_CHAT_ID="$value"   ;;
    esac
  done < ".env.local"
fi

# ── Git context ─────────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "")
AUTHOR=$(git log -1 --pretty=format:"%an" 2>/dev/null || echo "")

# ── Telegram send function ──────────────────────────────────────────────────
tg_send() {
  local message="$1"
  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    return 0
  fi
  curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
      \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
      \"text\": $(printf '%s' "$message" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
      \"parse_mode\": \"HTML\",
      \"disable_web_page_preview\": true
    }" \
    --max-time 10 \
    > /dev/null 2>&1 || true  # never block the push if Telegram is unreachable
}

# ── Timer helper ────────────────────────────────────────────────────────────
elapsed() {
  local start=$1
  local end
  end=$(date +%s)
  echo $((end - start))
}

# ── Run a check, capture result ─────────────────────────────────────────────
LINT_STATUS="⏭ skipped"
TYPECHECK_STATUS="⏭ skipped"
TESTS_STATUS="⏭ skipped"
LINT_TIME=0
TYPECHECK_TIME=0
TESTS_TIME=0
TESTS_DETAIL=""
AUTOFIX_SUMMARY=""
OVERALL_EXIT=0

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         Pre-push checks running          ║"
echo "╚══════════════════════════════════════════╝"
echo "  Branch : $BRANCH"
echo "  Commit : $COMMIT_HASH  $COMMIT_MSG"
echo ""

# ── 0. Auto-fix (ESLint + Prettier) ─────────────────────────────────────────
echo "▶ Auto-fixing..."
T_FIX=$(date +%s)

./node_modules/.bin/eslint . --fix > /dev/null 2>&1 || true
./node_modules/.bin/prettier . --write --log-level silent > /dev/null 2>&1 || true

# Check if any files were changed by auto-fix
FIXED_FILES=$(git diff --name-only 2>/dev/null || true)
FIXED_COUNT=$(echo "$FIXED_FILES" | grep -c '\.' || true)

if [ -n "$FIXED_FILES" ] && [ "$FIXED_COUNT" -gt 0 ]; then
  echo "  ⚡ Auto-fixed ${FIXED_COUNT} file(s):"
  echo "$FIXED_FILES" | sed 's/^/     /'
  # Stage and commit the auto-fixes
  git add -u
  git commit -m "chore: auto-fix lint and format [pre-push]" --no-verify > /dev/null 2>&1
  echo "  ✅ Committed as auto-fix"
  AUTOFIX_SUMMARY="⚡ Auto-fixed and committed ${FIXED_COUNT} file(s)"
else
  echo "  ✅ Nothing to fix"
fi
FIX_TIME=$(elapsed "$T_FIX")
echo "  → done (${FIX_TIME}s)"
echo ""

# ── 1. ESLint ────────────────────────────────────────────────────────────────
echo "▶ ESLint..."
T=$(date +%s)
LINT_EXIT=0
LINT_OUTPUT=$(./node_modules/.bin/eslint . 2>&1) || LINT_EXIT=$?
LINT_TIME=$(elapsed "$T")

LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c " error " || true)
LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c " warning " || true)

if [ $LINT_EXIT -eq 0 ]; then
  LINT_STATUS="✅ passed (${LINT_WARNINGS} warnings)"
else
  LINT_STATUS="❌ failed (${LINT_ERRORS} errors, ${LINT_WARNINGS} warnings)"
  OVERALL_EXIT=1
  # Show only error lines, not warnings flood
  echo "$LINT_OUTPUT" | grep " error " | head -20
fi
echo "  → $LINT_STATUS (${LINT_TIME}s)"
echo ""

# ── 2. TypeScript ────────────────────────────────────────────────────────────
if [ $OVERALL_EXIT -eq 0 ]; then
  echo "▶ TypeScript..."
  T=$(date +%s)
  TYPECHECK_EXIT=0
  TYPECHECK_OUTPUT=$(./node_modules/.bin/tsc --project tsconfig.check.json --noEmit 2>&1) || TYPECHECK_EXIT=$?
  if [ $TYPECHECK_EXIT -eq 0 ]; then
    TYPECHECK_STATUS="✅ passed"
  else
    TYPECHECK_STATUS="❌ failed"
    OVERALL_EXIT=1
    echo "$TYPECHECK_OUTPUT" | head -30
  fi
  TYPECHECK_TIME=$(elapsed "$T")
  echo "  → $TYPECHECK_STATUS (${TYPECHECK_TIME}s)"
  echo ""
fi

# ── 3. Tests ─────────────────────────────────────────────────────────────────
if [ $OVERALL_EXIT -eq 0 ]; then
  echo "▶ Tests..."
  T=$(date +%s)
  TESTS_EXIT=0
  TESTS_OUTPUT=$(./node_modules/.bin/jest --ci --passWithNoTests 2>&1) || TESTS_EXIT=$?
  TESTS_TIME=$(elapsed "$T")

  # Extract summary line (e.g. "Tests: 570 passed, 570 total")
  TESTS_DETAIL=$(echo "$TESTS_OUTPUT" | grep -E "^Tests:|Test Suites:" | tail -2 | tr '\n' ' ' || echo "")

  if [ $TESTS_EXIT -eq 0 ]; then
    TESTS_STATUS="✅ passed"
  else
    TESTS_STATUS="❌ failed"
    OVERALL_EXIT=1
    # Print the failure output to terminal
    echo "$TESTS_OUTPUT"
  fi
  echo "  → $TESTS_STATUS (${TESTS_TIME}s)"
  echo ""
fi

# ── Build result line ────────────────────────────────────────────────────────
if [ $OVERALL_EXIT -eq 0 ]; then
  RESULT_LINE="✅ <b>All checks passed — push allowed</b>"
  RESULT_EMOJI="✅"
else
  RESULT_LINE="❌ <b>Push blocked — fix errors before pushing</b>"
  RESULT_EMOJI="❌"
fi

# ── Telegram message ─────────────────────────────────────────────────────────
DETAIL_LINE=""
if [ -n "$TESTS_DETAIL" ]; then
  DETAIL_LINE="
<i>${TESTS_DETAIL}</i>"
fi

AUTOFIX_LINE=""
if [ -n "$AUTOFIX_SUMMARY" ]; then
  AUTOFIX_LINE="
${AUTOFIX_SUMMARY}"
fi

TG_MESSAGE="${RESULT_EMOJI} <b>Pre-push check</b>

📌 Branch: <code>${BRANCH}</code>
💬 <code>${COMMIT_HASH}</code> ${COMMIT_MSG}
👤 ${AUTHOR}${AUTOFIX_LINE}

<b>Checks:</b>
  ${LINT_STATUS} ESLint (${LINT_TIME}s)
  ${TYPECHECK_STATUS} TypeScript (${TYPECHECK_TIME}s)
  ${TESTS_STATUS} Tests (${TESTS_TIME}s)${DETAIL_LINE}

${RESULT_LINE}"

tg_send "$TG_MESSAGE"

# ── Terminal summary ─────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════╗"
if [ $OVERALL_EXIT -eq 0 ]; then
  echo "║  ✅  All checks passed. Push allowed.    ║"
else
  echo "║  ❌  Checks failed. Push blocked.        ║"
fi
echo "╚══════════════════════════════════════════╝"
echo ""

exit $OVERALL_EXIT
