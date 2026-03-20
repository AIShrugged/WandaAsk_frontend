---
name: daily-report
description:
  Generate today's changelog entry from git history and write it to
  changelog/YYYY-MM-DD.md. Use when closing a workday, summarizing today's
  changes, or adding a daily entry to the project changelog.
---

# Daily Report Skill

Generate a structured daily changelog entry from today's git commits and write
it to the project's `changelog/` directory.

## Step 1 — Get today's date and commits

```bash
# Today's date
date +%Y-%m-%d

# Today's commits (last 24h on current branch)
git log --oneline --since="today 00:00" --until="today 23:59"

# If nothing found, try last N commits
git log --oneline -10
```

## Step 2 — Read the diffs for today's commits

```bash
# Get full diff for today's commits
git log --since="today 00:00" --until="today 23:59" --format="%H" | xargs git show --stat 2>/dev/null | head -200

# Read actual diff for context (key changed files)
git diff $(git log --since="today 00:00" --format="%H" | tail -1)^..HEAD --stat
```

For each significant changed file, read it to understand **what** changed and
**why** — don't rely only on commit messages.

## Step 3 — Classify changes

Group into categories using these emoji prefixes:

| Category        | Emoji |
| --------------- | ----- |
| Новые функции   | ✨    |
| Улучшения       | 🔧    |
| Исправления     | 🐛    |
| Дизайн          | 🎨    |
| Тесты           | 🧪    |
| Инфраструктура  | 🏗️    |
| Рефакторинг     | ♻️    |
| Безопасность    | 🔒    |
| Агенты / скиллы | 🤖    |

Skip noise: auto-fix lint commits, whitespace changes.

## Step 4 — Check if today's file already exists

```bash
ls changelog/$(date +%Y-%m-%d).md 2>/dev/null && echo "exists" || echo "new"
```

- If **exists** — read it and **append** new sections, don't overwrite
- If **new** — create it from scratch

## Step 5 — Write changelog/YYYY-MM-DD.md

File format:

```markdown
# Отчёт — DD.MM.YYYY

## Кратко

- ✨ Название фичи
- 🔧 Улучшение X
- 🐛 Исправление Y
- 🧪 N новых тест-сьютов (+M тестов)

### ✨ Новые функции

- **Название**: что теперь умеет пользователь делать. Технические детали
  опционально.

### 🔧 Улучшения

- **Компонент**: что улучшено.

### 🐛 Исправления

- **Описание**: что было не так и как теперь работает.

### 🤖 Агенты / скиллы

- **`agent-name`**: что добавлено/изменено.

### 🏗️ Инфраструктура

- Технические изменения без влияния на пользователя.
```

The `## Кратко` block is **mandatory** — a one-line-per-item TL;DR at the top of
every report. Emoji prefix matches the category. Omit empty categories.

**Writing rules:**

1. Russian language throughout
2. Focus on user/developer impact, not implementation details
3. Group related commits into one bullet
4. Be specific: плохо — "улучшена страница"; хорошо — "Добавлена сортировка
   участников по роли"
5. Omit empty sections

## Step 6 — Output summary

After writing, confirm:

```
✅ Daily report written

📅 Date: YYYY-MM-DD
📝 File: changelog/YYYY-MM-DD.md
📊 Changes: ✨ N  🔧 N  🐛 N  🏗️ N
```

Show the full generated entry for the user to review.
