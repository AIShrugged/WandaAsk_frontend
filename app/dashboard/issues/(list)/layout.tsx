import { getPersons, IssuesLayoutClient } from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { FocusReminderBanner } from '@/features/user-focus';
import { getUserFocus } from '@/features/user-focus/api/focus';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import Card from '@/shared/ui/card/Card';

import type { PropsWithChildren } from 'react';

/**
 * IssuesLayout — shared layout for the issues/kanban sub-routes.
 * Fetches organizations and persons once server-side.
 * Filter state is initialized client-side from URL search params.
 */
export default async function IssuesLayout({ children }: PropsWithChildren) {
  const [organizationsResponse, persons, currentUserId, focus] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
      getUserFocus().catch(() => {
        return null;
      }),
    ]);

  return (
    <Card className='overflow-hidden'>
      <FocusReminderBanner focus={focus} />
      <IssuesLayoutClient
        organizations={organizationsResponse.data ?? []}
        persons={persons}
        currentUserId={currentUserId ?? null}
      >
        {children}
      </IssuesLayoutClient>
    </Card>
  );
}
