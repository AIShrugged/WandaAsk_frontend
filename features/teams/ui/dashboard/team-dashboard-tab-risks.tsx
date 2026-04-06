import { AlertCircle, AlertTriangle } from 'lucide-react';

import { Badge } from '@/shared/ui/badge/Badge';

import type { TabRisks } from '../../model/dashboard-types';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

interface TeamDashboardTabRisksProps {
  data: TabRisks;
}

/**
 * TeamDashboardTabRisks — risk items sorted by severity.
 * @param props - Component props.
 * @param props.data
 */
export default function TeamDashboardTabRisks({
  data,
}: TeamDashboardTabRisksProps) {
  if (data.items.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-10'>
        No risks identified
      </p>
    );
  }

  const sorted = [...data.items].toSorted(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div className='flex flex-col'>
      {sorted.map((item, i) => {return (
        <div
          key={item.id}
          className={`flex items-start gap-3 py-3 ${i < sorted.length - 1 ? 'border-b border-border/50' : ''}`}
        >
          {item.severity === 'high' ? (
            <AlertCircle className='h-4 w-4 text-red-400 flex-shrink-0 mt-0.5' />
          ) : (
            <AlertTriangle className='h-4 w-4 text-yellow-300 flex-shrink-0 mt-0.5' />
          )}
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-foreground'>{item.title}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {item.subtitle}
            </p>
          </div>
          <Badge variant='default' className='flex-shrink-0 capitalize'>
            {item.source}
          </Badge>
        </div>
      )})}
    </div>
  );
}
