---
title: refactor: Remove Methodology Feature
type: refactor
status: completed
date: 2026-05-07
---

# refactor: Remove Methodology Feature

## Overview

Полное удаление страниц `/dashboard/methodology` и всего связанного кода:
feature-слайс `features/methodology/`, маршруты App Router, unit-тесты,
серверные экшены, Zustand-стор, ссылки в навигации и роутах.

После выполнения задачи в проекте не должно остаться никакого кода,
принадлежащего или обслуживающего exclusively фичу methodology.

---

## Files to DELETE

Полное удаление — все содержимое этих файлов и директорий убирается из
репозитория.

### App Router — `app/dashboard/methodology/`

```
app/dashboard/methodology/page.tsx
app/dashboard/methodology/loading.tsx
app/dashboard/methodology/[id]/page.tsx
app/dashboard/methodology/[id]/loading.tsx
app/dashboard/methodology/create/page.tsx
app/dashboard/methodology/create/loading.tsx
```

### Feature Slice — `features/methodology/` (entire directory)

**API:**

```
features/methodology/api/methodology.ts
features/methodology/api/methodology-chat.ts
features/methodology/api/__tests__/methodology.test.ts
```

**Model:**

```
features/methodology/model/types.ts
features/methodology/model/methodology-store.ts
features/methodology/model/__tests__/methodology-store.test.ts
```

**Lib:**

```
features/methodology/lib/options.ts
features/methodology/lib/__tests__/options.test.ts
```

**UI:**

```
features/methodology/ui/methodology-form.tsx
features/methodology/ui/methodology-create.tsx
features/methodology/ui/methodology-item.tsx
features/methodology/ui/methodology-delete-modal.tsx
features/methodology/ui/methodology-list.tsx
features/methodology/ui/methodologies-action.tsx
features/methodology/ui/__tests__/methodologies-action.test.tsx
features/methodology/ui/__tests__/methodology-form.test.tsx
features/methodology/ui/__tests__/methodology-delete-modal.test.tsx
features/methodology/ui/__tests__/methodology-create.test.tsx
features/methodology/ui/__tests__/methodology-list.test.tsx
features/methodology/ui/__tests__/methodology-item.test.tsx
```

**Public API:**

```
features/methodology/index.ts
```

---

## Files to EDIT (keep file, remove methodology references)

### 1. `shared/lib/routes.ts`

Удалить константу `METHODOLOGY` из объекта `ROUTES.DASHBOARD`:

```ts
// Удалить:
METHODOLOGY: '/dashboard/methodology',
```

> **Предупреждение:** После удаления константы нужно убедиться, что ни один файл
> не импортирует `ROUTES.DASHBOARD.METHODOLOGY`. Файлы, перечисленные ниже, —
> единственные известные потребители.

### 2. `features/menu/lib/options.ts`

Удалить объект навигационного пункта сайдбара для methodology (~строки 60–65):

```ts
// Удалить весь этот объект:
{
  id: 'methodology',
  label: 'Methodologies',
  icon: 'bookOpen',
  href: ROUTES.DASHBOARD.METHODOLOGY,
  position: 70,
},
```

### 3. `app/dashboard/follow-ups/analysis/[id]/analysis/page.tsx`

- Удалить импорт `getMethodologyChat` из `@/features/methodology`
- Удалить блок логики, который вызывает `getMethodologyChat(...)` и передаёт
  `chatId` в `<FollowUpAnalysis>`
- Если проп `chatId` у `FollowUpAnalysis` обязателен — передать `chatId={null}`
  напрямую; если опционален — убрать проп совсем

Пример до:

```tsx
import { getMethodologyChat } from '@/features/methodology';
// ...
const chat = await getMethodologyChat(team.methodology_id);
<FollowUpAnalysis chatId={chat?.id ?? null} ... />
```

Пример после:

```tsx
<FollowUpAnalysis ... />
// или chatId={null} если проп остался обязательным
```

### 4. `features/follow-up/ui/follow-up-analysis.tsx`

- Удалить проп `chatId` (если он использовался только для передачи ID
  methodology-чата)
- Убрать связанную с `chatId` логику (conditional rendering, fallback на
  empty-state "нет methodology")
- Обновить интерфейс Props

### 5. `features/follow-up/ui/follow-up-analysis-polling.tsx`

- Убрать любые упоминания "methodology chat" в JSDoc-комментариях
- Удалить empty-state текст, ссылающийся на methodology chat (если такой есть)

### 6. `features/chat/ui/chat-suggestions.tsx`

Удалить одну запись из массива подсказок (~строки 23–24):

```ts
// Удалить:
{ label: 'Create methodology', prompt: 'Help create an employee evaluation methodology' },
```

---

## Files to LEAVE ALONE

Следующие файлы содержат слово "methodology" но **не связаны** с удаляемой
фичей:

| Файл                                            | Причина                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `entities/artifact/ui/methodology-criteria.tsx` | Artifact-рендерер для AI-генерируемых артефактов типа `methodology_criteria`; управляется бэкендом через `CreateArtifactTool` |
| `entities/artifact/model/types.ts`              | `MethodologyCriteriaArtifact` — часть union-типа артефактов; определяется бэкенд-контрактом                                   |
| `entities/team/model/types.ts`                  | Поле `methodology_id: number \| null` отражает бэкенд `TeamResource`; удалять нельзя                                          |
| `features/follow-up/model/types.ts`             | Поле `methodology_id: number \| null` на `FollowUpProps` — бэкенд-контракт                                                    |
| Тесты follow-up (`*.test.ts(x)`)                | Упоминают `methodology_id` только в fixture-данных; тестируют follow-up фичу                                                  |

---

## Acceptance Criteria

- [x] Страница `/dashboard/methodology` возвращает 404
- [x] Страницы `/dashboard/methodology/[id]` и `/dashboard/methodology/create`
      возвращают 404
- [x] `features/methodology/` полностью удалена из репозитория
- [x] `ROUTES.DASHBOARD.METHODOLOGY` удалена из `shared/lib/routes.ts`
- [x] Пункт "Methodologies" отсутствует в сайдбаре
- [x] `app/dashboard/follow-ups/analysis/[id]/analysis/page.tsx` не импортирует
      из `features/methodology`
- [x] `npm run build` завершается без ошибок
- [x] `npm run lint` завершается без ошибок (нет broken imports)
- [x] `npm test -- --ci --passWithNoTests` завершается без ошибок
- [x] Артефакт-рендерер `methodology-criteria.tsx` продолжает работать (не
      затронут)

---

## Implementation Order

Выполнять в таком порядке, чтобы минимизировать broken imports в промежуточных
состояниях:

1. **Редактировать файлы с зависимостями** (сначала удалить все импорты из
   `features/methodology`):
   - `app/dashboard/follow-ups/analysis/[id]/analysis/page.tsx`
   - `features/follow-up/ui/follow-up-analysis.tsx`
   - `features/follow-up/ui/follow-up-analysis-polling.tsx`
   - `features/chat/ui/chat-suggestions.tsx`
   - `features/menu/lib/options.ts`
   - `shared/lib/routes.ts`

2. **Удалить App Router директорию** `app/dashboard/methodology/` (6 файлов)

3. **Удалить Feature Slice** `features/methodology/` (целиком)

4. **Финальная проверка:**
   ```bash
   grep -r "features/methodology" app/ features/ shared/ widgets/ --include="*.ts" --include="*.tsx"
   # должно вернуть пустой результат
   grep -r "METHODOLOGY" shared/lib/routes.ts
   # должно вернуть пустой результат
   npm run lint && npm run build && npm test -- --ci --passWithNoTests
   ```

---

## Risk Analysis

| Риск                                                                         | Вероятность | Митигация                                                       |
| ---------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| `follow-up-analysis.tsx` зависит от `chatId` глубже чем видно на поверхности | Средняя     | Прочитать весь компонент перед правкой; проверить все вызовы    |
| Скрытый импорт из `features/methodology` в файлах, не найденных grep'ом      | Низкая      | Запустить `grep -r "methodology"` после удаления перед коммитом |
| `npm test` падает из-за удалённых тест-файлов                                | Нет         | Jest просто не находит файлы — тесты не падают                  |

---

## References

- Связанный рефактор (паттерн удаления dead code):
  `docs/plans/2026-05-06-refactor-dead-code-removal-and-shared-ui-consolidation-plan.md`
- Последнее изменение methodology-фичи:
  `docs/plans/2026-04-02-feat-methodology-teams-display-plan.md`
- FSD правила импортов: `CLAUDE.md` → раздел "FSD Layer Rules"
- Artifact-система (НЕ трогать): `entities/artifact/ui/methodology-criteria.tsx`
