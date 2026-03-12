#!/usr/bin/env bash
# git push wrapper — runs push and sends Telegram notification on completion
# Usage: bash scripts/push.sh [git push args]
# Add to package.json: "push": "bash scripts/push.sh"

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# ── Load Telegram credentials from .env.local ──────────────────────────────
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

if [ -f ".env.local" ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    case "$key" in
      "#"|"") continue ;;
    esac
    case "$key" in
      TELEGRAM_BOT_TOKEN) TELEGRAM_BOT_TOKEN="$value" ;;
      TELEGRAM_CHAT_ID)   TELEGRAM_CHAT_ID="$value"   ;;
    esac
  done < ".env.local"
fi

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
    > /dev/null 2>&1 || true
}

# ── Git context ─────────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "")
AUTHOR=$(git log -1 --pretty=format:"%an" 2>/dev/null || echo "")

# Detect remote from args (default: origin)
REMOTE="origin"
for arg in "$@"; do
  case "$arg" in
    -*) ;;        # skip flags
    */*) ;;       # skip refspecs
    *) REMOTE="$arg"; break ;;
  esac
done
REMOTE_URL=$(git remote get-url "$REMOTE" 2>/dev/null | sed 's|.*[:/]\([^/]*/[^/]*\)\.git|\1|' | sed 's|.*[:/]\([^/]*/[^/]*\)$|\1|' || echo "$REMOTE")

# ── Capture remote HEAD before push (for diff stats) ───────────────────────
REMOTE_BEFORE=$(git rev-parse "${REMOTE}/${BRANCH}" 2>/dev/null || echo "")

# ── Run the actual push ─────────────────────────────────────────────────────
echo ""
echo "▶ Pushing to $REMOTE ($BRANCH)..."
echo ""

T_PUSH=$(date +%s)
PUSH_EXIT=0
git push "$@" || PUSH_EXIT=$?
PUSH_TIME=$(( $(date +%s) - T_PUSH ))

echo ""

# ── PR link (if gh CLI is available) ───────────────────────────────────────
PR_LINE=""
if command -v gh > /dev/null 2>&1; then
  PR_URL=$(gh pr view --json url -q '.url' 2>/dev/null || echo "")
  PR_TITLE=$(gh pr view --json title -q '.title' 2>/dev/null || echo "")
  if [ -n "$PR_URL" ]; then
    PR_LINE="
🔀 <b>PR:</b> <a href=\"${PR_URL}\">${PR_TITLE}</a>"
  fi
fi

# ── Send notification ───────────────────────────────────────────────────────
if [ $PUSH_EXIT -eq 0 ]; then
  # ── Gather push statistics ────────────────────────────────────────────────
  STATS_LINES=""

  if [ -n "$REMOTE_BEFORE" ]; then
    RANGE="${REMOTE_BEFORE}..HEAD"

    COMMITS_COUNT=$(git rev-list --count "$RANGE" 2>/dev/null || echo "0")
    SHORTSTAT=$(git diff --shortstat "$RANGE" 2>/dev/null || echo "")
    COMMIT_LIST=$(git log --oneline --reverse "$RANGE" 2>/dev/null | head -7 | sed 's/^/  • /' || echo "")

    # Parse shortstat: "3 files changed, 120 insertions(+), 5 deletions(-)"
    FILES_CHANGED=$(echo "$SHORTSTAT" | grep -oE '[0-9]+ file' | grep -oE '[0-9]+' || echo "0")
    INSERTIONS=$(echo "$SHORTSTAT" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
    DELETIONS=$(echo "$SHORTSTAT" | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")

    STATS_LINES="
📊 <b>Push stats:</b>
  🔢 Commits: <b>${COMMITS_COUNT}</b>
  📁 Files changed: <b>${FILES_CHANGED}</b>
  ➕ Lines added: <b>+${INSERTIONS}</b>  ➖ removed: <b>-${DELETIONS}</b>
  ⏱ Push time: <b>${PUSH_TIME}s</b>"

    if [ -n "$COMMIT_LIST" ]; then
      STATS_LINES="${STATS_LINES}

<b>Commits:</b>
<code>${COMMIT_LIST}</code>"
    fi
  else
    # New branch — no remote ref yet
    STATS_LINES="
📊 <b>Push stats:</b>
  🆕 New branch pushed
  ⏱ Push time: <b>${PUSH_TIME}s</b>"
  fi

  tg_send "🚀 <b>Pushed successfully</b>

📌 Branch: <code>${BRANCH}</code>
🔗 Remote: <code>${REMOTE_URL}</code>
💬 <code>${COMMIT_HASH}</code> ${COMMIT_MSG}
👤 ${AUTHOR}${PR_LINE}${STATS_LINES}"

  echo "✅ Push successful. Notification sent."
else
  tg_send "💥 <b>Push failed</b>

📌 Branch: <code>${BRANCH}</code>
👤 ${AUTHOR}
⏱ Time spent: <b>${PUSH_TIME}s</b>

Check the terminal for details."

  echo "❌ Push failed."
fi

exit $PUSH_EXIT
