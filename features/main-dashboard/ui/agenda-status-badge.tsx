import { Badge } from '@/shared/ui/badge';

import type { AgendaStatus } from '@/features/main-dashboard/model/agenda-types';

interface AgendaStatusBadgeProps {
  status: AgendaStatus;
}

const STATUS_CONFIG: Record<
  AgendaStatus,
  { variant: 'default' | 'warning' | 'success' | 'destructive'; label: string }
> = {
  pending: { variant: 'default', label: 'Pending' },
  in_progress: { variant: 'warning', label: 'Preparing' },
  done: { variant: 'success', label: 'Ready' },
  failed: { variant: 'destructive', label: 'Failed' },
};

/**
 * AgendaStatusBadge — renders a colored badge for a meeting agenda status.
 * @param root0
 * @param root0.status
 */
export function AgendaStatusBadge({ status }: AgendaStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
