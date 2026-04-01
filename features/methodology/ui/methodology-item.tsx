import Link from 'next/link';

import { MethodologiesAction } from '@/features/methodology/ui/methodologies-action';
import { ROUTES } from '@/shared/lib/routes';
import { H3 } from '@/shared/ui/typography/H3';

import type { MethodologyProps } from '@/features/methodology/model/types';

/**
 * MethodologyItem component.
 * @param root0
 * @param root0.methodology
 */
export default function MethodologyItem({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const route = `${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`;
  const teams = Array.isArray(methodology.teams) ? methodology.teams : [];
  const isActive = teams.length > 0;

  return (
    <div className='border-b border-border'>
      <div className='py-6 flex items-center justify-between group'>
        <Link
          className='cursor-pointer flex-1 flex items-center gap-3'
          href={route}
        >
          <H3>{methodology.name}</H3>
          {methodology.is_default && (
            <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border'>
              Default
            </span>
          )}
          {isActive && (
            <span
              className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
              title={teams
                .map((t) => {
                  return t.name;
                })
                .join(', ')}
            >
              Active
            </span>
          )}
        </Link>

        <MethodologiesAction methodology={methodology} />
      </div>
    </div>
  );
}
