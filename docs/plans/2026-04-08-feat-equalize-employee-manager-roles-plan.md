---
title: 'feat: Equalize employee role permissions to match manager'
type: feat
status: active
date: 2026-04-08
---

# feat: Equalize employee role permissions to match manager

## Overview

Полностью уравнять роль `employee` с ролью `manager` в системе — убрать все
различия в правах доступа между этими двумя ролями как на бэкенде, так и на
фронтенде.

**Важно:** задача не предполагает удаление роли `employee` из базы данных или
схемы — роль как значение остаётся, но её ограничения снимаются полностью.

---

## Что сейчас ограничено для `employee`

### Backend — Policies

| Файл                                     | Метод     | Что запрещено `employee`             |
| ---------------------------------------- | --------- | ------------------------------------ |
| `app/Policies/TeamPolicy.php:24`         | `create`  | Создавать команды                    |
| `app/Policies/TeamPolicy.php:29`         | `update`  | Редактировать команды                |
| `app/Policies/TeamPolicy.php:34`         | `destroy` | Удалять команды                      |
| `app/Policies/TeamPolicy.php:19`         | `view`    | Видеть команду, в которой не состоит |
| `app/Policies/InvitePolicy.php:16`       | `viewAny` | Видеть инвайты                       |
| `app/Policies/InvitePolicy.php:24`       | `create`  | Отправлять инвайты                   |
| `app/Policies/InvitePolicy.php:32`       | `delete`  | Удалять инвайты                      |
| `app/Policies/MethodologyPolicy.php:36`  | `create`  | Создавать методологии                |
| `app/Policies/MethodologyPolicy.php:44`  | `update`  | Редактировать методологии            |
| `app/Policies/MethodologyPolicy.php:52`  | `delete`  | Удалять методологии                  |
| `app/Policies/OrganizationPolicy.php:29` | `update`  | Редактировать организацию            |
| `app/Policies/TeamUserPolicy.php:29`     | `kick`    | Кикать участников из команды         |

### Backend — Controllers (прямые проверки без Policy)

| Файл                                                         | Строка | Что запрещено `employee`  |
| ------------------------------------------------------------ | ------ | ------------------------- |
| `app/Http/Controllers/API/v1/AgentToolController.php:25`     | —      | Просматривать agent tools |
| `app/Http/Controllers/API/v1/AgentProfileController.php:186` | —      | Управлять agent profiles  |
| `app/Http/Controllers/API/v1/AgentTaskController.php:230`    | —      | Управлять agent tasks     |

### Backend — Services (бизнес-логика)

| Файл                                                          | Строка                          | Что ограничено                                       |
| ------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| `app/Services/Chat/FollowupAccessService.php:28`              | `canAccessTeamData`             | Видеть данные чужой команды в AI-чате                |
| `app/Services/Chat/FollowupAccessService.php:33`              | `canAccessOrganizationData`     | Видеть данные организации в AI-чате                  |
| `app/Services/Chat/FollowupAccessService.php:41`              | `getAccessibleUserIds`          | Получать ID всех пользователей орга                  |
| `app/Services/Chat/FollowupAccessService.php:52`              | `getAccessibleTeamIds`          | Получать ID всех команд орга                         |
| `app/Services/Chat/FollowupAccessService.php:68`              | `getAccessibleOrganizationIds`  | Получать ID управляемых организаций                  |
| `app/Services/Workspace/WorkspaceAccessService.php:85`        | `abilitiesForUser`              | Полный admin-доступ к workspace                      |
| `app/Services/Workspace/WorkspaceAccessService.php:154`       | `resolveAccessibleWorkspaceIds` | Видеть все workspace-ы орга                          |
| `app/Services/Workspace/WorkspaceProvisioningService.php:154` | `assertCreateAllowed`           | Создавать shared workspace-ы                         |
| `app/Services/Workspace/WorkspaceProvisioningService.php:158` | `assertCreateAllowed`           | Создавать private workspace для другого пользователя |
| `app/Services/TelegramChatRegistrationService.php:123`        | —                               | Привязывать Telegram-чат к организации               |
| `app/Services/TenantScopeValidator.php:65`                    | —                               | Привязывать Telegram-чат                             |
| `app/Services/AgentTaskMutationService.php:91`                | —                               | Управлять agent tasks через мутацию                  |

### Backend — Agent AI Tools

| Файл                                                       | Строка | Ограничение                               |
| ---------------------------------------------------------- | ------ | ----------------------------------------- |
| `app/Services/Agent/Tools/GetUserOrganizationsTool.php:37` | —      | Возвращает только manager-организации     |
| `app/Services/Agent/Tools/GetOrganizationTeamsTool.php:52` | —      | Требует `isOrganizationManager()`         |
| `app/Services/Agent/Tools/SaveMethodologyTool.php:82`      | —      | Создавать методологии через AI            |
| `app/Services/Agent/Tools/CreateIssueTool.php:161`         | —      | Создавать org-level issues без team scope |
| `app/Services/Agent/Tools/UpdateAgentTaskTool.php:89`      | —      | Обновлять agent tasks через AI            |
| `app/Services/Agent/Tools/DeleteWorkspaceTool.php:56`      | —      | Удалять workspace через AI                |

### Frontend — UI-гейтинг

| Файл                                                   | Строка                    | Что скрыто от `employee`                   |
| ------------------------------------------------------ | ------------------------- | ------------------------------------------ |
| `features/agents/lib/access.ts:11-12`                  | `isOrganizationManager()` | Весь агентский раздел                      |
| `app/dashboard/agents/tasks/page.tsx:22`               | —                         | Agent Tasks страница → `AccessDeniedState` |
| `app/dashboard/agents/tasks/new/page.tsx:33`           | —                         | Создать agent task → `AccessDeniedState`   |
| `app/dashboard/agents/tasks/[id]/page.tsx:76`          | —                         | Детали task → `AccessDeniedState`          |
| `app/dashboard/agents/activity/page.tsx:16`            | —                         | Agent Activity → `AccessDeniedState`       |
| `app/dashboard/agents/profiles/page.tsx:31`            | —                         | Agent Profiles → `AccessDeniedState`       |
| `app/dashboard/agents/profiles/new/page.tsx:28`        | —                         | Создать профиль → `AccessDeniedState`      |
| `app/dashboard/agents/profiles/[id]/page.tsx:48`       | —                         | Детали профиля → `AccessDeniedState`       |
| `features/main-dashboard/ui/agent-tasks-block.tsx:152` | —                         | Ссылка "View all tasks" скрыта             |

---

## Acceptance Criteria

- [ ] `employee` может создавать, редактировать и удалять команды
- [ ] `employee` может видеть и управлять инвайтами
- [ ] `employee` может создавать, редактировать и удалять методологии
- [ ] `employee` может редактировать организацию
- [ ] `employee` может кикать участников из команды
- [ ] `employee` видит раздел Agents (profiles, tasks, activity)
- [ ] `employee` имеет доступ ко всем workspace-ам организации
- [ ] `employee` видит данные всех пользователей и команд организации в AI-чате
- [ ] `employee` может привязывать Telegram-чат
- [ ] AI-инструменты (GetUserOrganizations, SaveMethodology, CreateIssue,
      UpdateAgentTask, DeleteWorkspace) работают для `employee` так же, как для
      `manager`
- [ ] Фронтенд: `isOrganizationManager()` возвращает `true` для обеих ролей
- [ ] Фронтенд: `canManageAgents` выставляется в `true` для `employee`

---

## Implementation Plan

### Phase 1 — Backend: Policies (5 файлов)

Заменить `isOrganizationManager()` на `isOrganizationMember()` в каждом методе,
который ограничивает `employee`:

**`app/Policies/TeamPolicy.php`**

- `create`: `isOrganizationManager` → `isOrganizationMember`
- `update`: `isOrganizationManager($team->organization)` →
  `isOrganizationMember($team->organization)`
- `destroy`: `isOrganizationManager($team->organization)` →
  `isOrganizationMember($team->organization)`

**`app/Policies/InvitePolicy.php`**

- `viewAny`, `create`, `delete`: все три → `isOrganizationMember`

**`app/Policies/MethodologyPolicy.php`**

- `create`, `update`, `delete`: все три → `isOrganizationMember`

**`app/Policies/OrganizationPolicy.php`**

- `update`: `isOrganizationManager` → `isOrganizationMember`

**`app/Policies/TeamUserPolicy.php`**

- `kick`: `isOrganizationManager` → `isOrganizationMember`

### Phase 2 — Backend: Controllers (3 файла)

**`app/Http/Controllers/API/v1/AgentToolController.php`**

- Убрать `wherePivot('role', MANAGER)` проверку, заменить на
  `isOrganizationMember` любой орги:
  ```php
  $isMember = $request->user()->organizations()->exists();
  if (!$isMember) { throw AppException... }
  ```

**`app/Http/Controllers/API/v1/AgentProfileController.php`** — метод
`assertUserCanManageProfiles`

- Заменить `wherePivot('role', MANAGER)->exists()` на `->exists()` (без фильтра
  роли)

**`app/Http/Controllers/API/v1/AgentTaskController.php`** — методы
`managedOrganizationIds` + `assertUserManagesAnyOrganization`

- Убрать `wherePivot('role', MANAGER)` → возвращать все организации пользователя
- Переименовать метод `managedOrganizationIds` → `memberOrganizationIds` (или
  оставить название, убрав фильтр)

### Phase 3 — Backend: Services (6 файлов)

**`app/Services/Chat/FollowupAccessService.php`**

- `canAccessTeamData`: убрать проверку, возвращать `true` если user — member
  организации
- `canAccessOrganizationData`: аналогично `isOrganizationMember`
- `getAccessibleUserIds`: убрать `wherePivot('role', MANAGER)` — брать все
  организации
- `getAccessibleTeamIds`: аналогично
- `getAccessibleOrganizationIds`: аналогично
- `getUserRole`: всегда возвращать `manager` (или убрать различие) — оба
  направления дают одинаковый набор доступов
- `getAccessDescription`: всегда идти по ветке manager-доступа
- `isManagerOfUser` (private): заменить на `isMemberOfSameOrganization`

**`app/Services/Workspace/WorkspaceAccessService.php`**

- `abilitiesForUser` строка 85: добавить
  `|| $user->isOrganizationMember($workspace->organization_id)` к условию
  полного доступа
- `resolveAccessibleWorkspaceIds` строка 154: убрать `managedOrganizationIds`,
  заменить на `organizationIds` (используя уже имеющуюся переменную
  `$organizationIds`)

**`app/Services/Workspace/WorkspaceProvisioningService.php`**

- строка 154: убрать проверку `isOrganizationManager` для shared workspace
- строка 158: убрать проверку для создания private workspace для другого
  пользователя

**`app/Services/TelegramChatRegistrationService.php`**

- строка 123: `isOrganizationManager` → `isOrganizationMember`

**`app/Services/TenantScopeValidator.php`**

- строка 65: `isOrganizationManager` → `isOrganizationMember`

**`app/Services/AgentTaskMutationService.php`**

- строка 91: `isOrganizationManager` → `isOrganizationMember`

### Phase 4 — Backend: Agent AI Tools (5 файлов)

**`app/Services/Agent/Tools/GetUserOrganizationsTool.php`**

- Убрать `wherePivot('role', MANAGER)` — возвращать все организации пользователя

**`app/Services/Agent/Tools/GetOrganizationTeamsTool.php`**

- Заменить `isOrganizationManager()` на `isOrganizationMember()`

**`app/Services/Agent/Tools/SaveMethodologyTool.php`**

- строка 82: `isOrganizationManager` → `isOrganizationMember`

**`app/Services/Agent/Tools/CreateIssueTool.php`**

- строка 161: `isOrganizationManager` → `isOrganizationMember`

**`app/Services/Agent/Tools/UpdateAgentTaskTool.php`**

- строка 89: `isOrganizationManager` → `isOrganizationMember`

**`app/Services/Agent/Tools/DeleteWorkspaceTool.php`**

- строка 56: `isOrganizationManager` → `isOrganizationMember`

### Phase 5 — Frontend: Access util (1 файл)

**`features/agents/lib/access.ts`**

Изменить `isOrganizationManager` — принимать любого member:

```ts
// Было:
export function isOrganizationManager(role: string | null | undefined) {
  return role?.trim().toLowerCase() === 'manager';
}

// Стало:
export function isOrganizationManager(role: string | null | undefined) {
  const normalized = role?.trim().toLowerCase();
  return normalized === 'manager' || normalized === 'employee';
}
```

Или переименовать функцию в `isOrganizationMember` и обновить все вызовы:

- `getAgentAccessContext`:
  `canManageAgents: isOrganizationMember(activeOrganization?.pivot.role)`
- Все 7 страниц агентов уже используют `canManageAgents` — менять их не нужно

---

## Files to Change

### Backend (`/Users/slavapopov/Documents/WandaAsk_backend`)

```
app/Policies/TeamPolicy.php
app/Policies/InvitePolicy.php
app/Policies/MethodologyPolicy.php
app/Policies/OrganizationPolicy.php
app/Policies/TeamUserPolicy.php
app/Http/Controllers/API/v1/AgentToolController.php
app/Http/Controllers/API/v1/AgentProfileController.php
app/Http/Controllers/API/v1/AgentTaskController.php
app/Services/Chat/FollowupAccessService.php
app/Services/Workspace/WorkspaceAccessService.php
app/Services/Workspace/WorkspaceProvisioningService.php
app/Services/TelegramChatRegistrationService.php
app/Services/TenantScopeValidator.php
app/Services/AgentTaskMutationService.php
app/Services/Agent/Tools/GetUserOrganizationsTool.php
app/Services/Agent/Tools/GetOrganizationTeamsTool.php
app/Services/Agent/Tools/SaveMethodologyTool.php
app/Services/Agent/Tools/CreateIssueTool.php
app/Services/Agent/Tools/UpdateAgentTaskTool.php
app/Services/Agent/Tools/DeleteWorkspaceTool.php
```

### Frontend (`/Users/slavapopov/Documents/WandaAsk_frontend`)

```
features/agents/lib/access.ts
```

---

## What NOT to change

- `app/Enums/UserRole.php` — enum остаётся как есть (значения `manager` /
  `employee` сохраняются)
- Database migrations — схема БД не меняется, роли в `organization_user` не
  трогаются
- Логика назначения роли при регистрации/инвайте — создатель орга остаётся
  `manager`, приглашённые остаётся `employee` по умолчанию
- `app/Policies/OrganizationPolicy.php:delete` — уже разрешено для
  `isOrganizationMember`, не трогать
- Отображение роли в UI (organization-dropdown, organization-list) — остаётся
  информационным

---

## Verification

1. Войти как `employee` — убедиться, что открывается
   `/dashboard/agents/profiles`, `/tasks`, `/activity`
2. Создать команду от имени `employee` — должно работать без 403
3. Создать инвайт от имени `employee` — должно работать
4. В AI-чате от имени `employee` спросить про данные другого пользователя из той
   же организации — должно вернуть данные
5. Попробовать создать workspace типа `org_shared` от имени `employee` — должно
   работать
6. Запустить бэкенд-тесты: `php artisan test` — не должно быть регрессий
7. Запустить фронтенд-тесты: `npm test` — не должно быть регрессий
