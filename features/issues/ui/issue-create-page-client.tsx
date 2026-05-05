'use client';

import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';

import { IssueAttachments } from './issue-attachments';
import { IssueForm } from './issue-form';

import type { OrganizationProps } from '@/entities/organization';
import type {
  EpicOption,
  Issue,
  PersonOption,
} from '@/features/issues/model/types';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

interface IssueCreatePageClientProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  epics?: EpicOption[];
  defaultOrganizationId: string;
  currentUser: CurrentUser | null;
}

export function IssueCreatePageClient({
  organizations,
  persons,
  epics = [],
  defaultOrganizationId,
  currentUser,
}: IssueCreatePageClientProps) {
  // Stable for the lifetime of this component — one UUID per create session.
  // useMemo with [] deps is generated once on mount, clear intent vs useRef.
  const uploadToken = useMemo(() => {return crypto.randomUUID()}, []);
  const [createdIssue, setCreatedIssue] = useState<Issue | null>(null);

  if (createdIssue === null) {
    return (
      <IssueForm
        organizations={organizations}
        persons={persons}
        epics={epics}
        defaultOrganizationId={defaultOrganizationId}
        currentUser={currentUser}
        onCreated={setCreatedIssue}
        uploadToken={uploadToken}
      />
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <p className='text-sm font-medium text-green-500'>
        Task #{createdIssue.id} created successfully.
      </p>
      <IssueAttachments
        issueId={createdIssue.id}
        initialAttachments={createdIssue.attachments ?? []}
      />
      <a
        href={`${ROUTES.DASHBOARD.ISSUES}/${createdIssue.id}`}
        className='inline-flex items-center gap-2 self-end text-sm font-medium text-primary hover:underline'
      >
        Go to task
        <ArrowRight className='h-4 w-4' />
      </a>
    </div>
  );
}
