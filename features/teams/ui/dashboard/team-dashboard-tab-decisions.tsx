'use client';

import { DecisionsPage } from '@/features/decisions/ui/decisions-page';

interface Props {
  teamId: number;
}

export default function TeamDashboardTabDecisions({ teamId }: Props) {
  return <DecisionsPage teamId={teamId} />;
}
