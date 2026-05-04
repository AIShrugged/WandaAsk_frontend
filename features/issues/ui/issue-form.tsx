'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createIssue,
  deleteIssue,
  updateIssue,
} from '@/features/issues/api/issues';
import {
  ISSUE_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  issueTypeOptionsFromOrgs,
} from '@/features/issues/model/types';
import { getTeams } from '@/features/teams/api/team';
import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import InputTextarea from '@/shared/ui/input/InputTextarea';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';

import type { OrganizationProps } from '@/entities/organization';
import type {
  EpicOption,
  Issue,
  IssueStatus,
  PersonOption,
} from '@/features/issues/model/types';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

interface IssueFormProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  epics?: EpicOption[];
  issue?: Issue;
  defaultOrganizationId?: string;
  currentUser?: CurrentUser | null;
}

interface IssueFormValues {
  name: string;
  description: string;
  type: string;
  status: IssueStatus | '';
  organization_id: string;
  team_id: string;
  epic_id: string;
  assignee_id: string;
  author_id: string;
  due_date: string;
  priority: string;
}

function defaultDueDate(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function IssueForm({
  organizations,
  persons,
  epics = [],
  issue,
  defaultOrganizationId = '',
  currentUser,
}: IssueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState('');
  const typeOptions = issueTypeOptionsFromOrgs(organizations);

  const defaultAuthorId = issue?.user_id
    ? String(issue.user_id)
    : String(currentUser?.id ?? '');

  const defaultValues = useMemo<IssueFormValues>(() => {
    return {
      name: issue?.name ?? '',
      description: issue?.description ?? '',
      type: issue?.type ?? '',
      status: issue?.status ?? '',
      organization_id: issue?.organization_id
        ? String(issue.organization_id)
        : defaultOrganizationId,
      team_id: issue?.team_id ? String(issue.team_id) : '',
      epic_id: issue?.epic_id ? String(issue.epic_id) : '',
      assignee_id: issue?.assignee_id ? String(issue.assignee_id) : '',
      author_id: defaultAuthorId,
      due_date: issue?.due_date ?? defaultDueDate(),
      priority: String(issue?.priority ?? 0),
    };
  }, [defaultOrganizationId, issue, defaultAuthorId]);

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<IssueFormValues>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const personOptions = [
    { value: '', label: 'Unassigned' },
    ...persons.map((person) => {
      return {
        value: String(person.id),
        label: person.email ? `${person.name} (${person.email})` : person.name,
      };
    }),
  ];

  const statusOptions = ISSUE_STATUS_OPTIONS;

  const onSubmit = (values: IssueFormValues) => {
    setRootError('');

    if (!values.organization_id) {
      setError('organization_id', { message: 'Organization is required' });
      return;
    }

    if (!values.status) {
      setError('status', { message: 'Status is required' });
      return;
    }

    const status = values.status as IssueStatus;

    startTransition(async () => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        type: values.type,
        status,
        organization_id: Number(values.organization_id),
        team_id: values.team_id ? Number(values.team_id) : null,
        epic_id: values.epic_id ? Number(values.epic_id) : null,
        assignee_id: values.assignee_id ? Number(values.assignee_id) : null,
        author_id: values.author_id ? Number(values.author_id) : null,
        due_date: values.due_date || null,
        priority: Number(values.priority) || 0,
      };
      const result = issue
        ? await updateIssue(issue.id, payload)
        : await createIssue(payload);

      if ('error' in result) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (
              field in defaultValues ||
              field === 'organization_id' ||
              field === 'team_id'
            ) {
              setError(field as keyof IssueFormValues, { message });
            }
          }
        }

        setRootError(result.error);
        return;
      }

      toast.success(issue ? 'Issue updated' : 'Issue created');
      if (issue) {
        router.refresh();
      } else {
        router.push(`${ROUTES.DASHBOARD.ISSUES}/${result.id}`);
      }
    });
  };

  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name', {
          onChange: () => {
            clearErrors('name');
            setRootError('');
          },
        })}
        label='Name'
        value={watch('name')}
        error={errors.name?.message}
      />
      <InputTextarea
        {...register('description', {
          onChange: () => {
            clearErrors('description');
            setRootError('');
          },
        })}
        label='Description'
        value={watch('description')}
        error={errors.description?.message}
      />
      <div className='grid gap-2 md:grid-cols-2'>
        <InputDropdown
          label='Type'
          options={[{ value: '', label: 'Select type' }, ...typeOptions]}
          value={watch('type')}
          onChange={(value) => {
            setValue('type', value as string, { shouldDirty: true });
            clearErrors('type');
            setRootError('');
          }}
          error={errors.type?.message}
        />

        <InputDropdown
          label='Status'
          options={statusOptions}
          value={watch('status')}
          onChange={(value) => {
            setValue('status', value as IssueStatus, { shouldDirty: true });
            clearErrors('status');
            setRootError('');
          }}
          error={errors.status?.message}
        />
      </div>

      <TenantScopeFields
        organizations={organizations}
        organizationId={watch('organization_id')}
        teamId={watch('team_id')}
        fetchTeams={getTeams}
        onOrganizationChange={(value) => {
          setValue('organization_id', value, { shouldDirty: true });
          setValue('team_id', '', { shouldDirty: true });
          clearErrors(['organization_id', 'team_id']);
        }}
        onTeamChange={(value) => {
          setValue('team_id', value, { shouldDirty: true });
          clearErrors('team_id');
        }}
        organizationError={errors.organization_id?.message}
        teamError={errors.team_id?.message}
        disabled={isPending}
      />

      <InputDropdown
        label='Epic'
        options={[
          { value: '', label: 'None' },
          ...epics.map((e) => {
            return { value: String(e.id), label: e.name };
          }),
        ]}
        value={watch('epic_id')}
        onChange={(value) => {
          setValue('epic_id', value as string, { shouldDirty: true });
        }}
        searchable
      />

      <div className='grid gap-2 md:grid-cols-2'>
        <InputDropdown
          label='Assignee'
          options={personOptions}
          value={watch('assignee_id')}
          onChange={(value) => {
            setValue('assignee_id', value as string, { shouldDirty: true });
            clearErrors('assignee_id');
          }}
          searchable
          error={errors.assignee_id?.message}
        />

        <InputDropdown
          label='Author'
          options={personOptions}
          value={watch('author_id')}
          onChange={(value) => {
            setValue('author_id', value as string, { shouldDirty: true });
            clearErrors('author_id');
          }}
          searchable
          error={errors.author_id?.message}
        />
      </div>

      <div className='grid gap-2 md:grid-cols-2'>
        <Input
          {...register('due_date', {
            onChange: () => {
              clearErrors('due_date');
              setRootError('');
            },
          })}
          type='date'
          label='Deadline'
          value={watch('due_date')}
          error={errors.due_date?.message}
        />

        <InputDropdown
          label='Priority'
          options={PRIORITY_OPTIONS}
          value={watch('priority')}
          onChange={(value) => {
            setValue('priority', value as string, { shouldDirty: true });
            clearErrors('priority');
          }}
          error={errors.priority?.message}
        />
      </div>

      {rootError ? (
        <p className='text-sm text-destructive'>{rootError}</p>
      ) : null}

      <div className='grid gap-2 md:grid-cols-2'>
        <Button
          type='submit'
          loading={isPending}
          disabled={isPending || !isDirty}
        >
          {issue ? 'Save changes' : 'Create task'}
        </Button>
        {issue ? (
          <Button
            type='button'
            variant={BUTTON_VARIANT.danger}
            className='w-auto px-4'
            onClick={() => {
              startTransition(async () => {
                await deleteIssue(issue.id);
                toast.success('Task deleted');
                router.push(ROUTES.DASHBOARD.ISSUES);
              });
            }}
          >
            Delete issue
          </Button>
        ) : null}
      </div>
    </form>
  );
}
