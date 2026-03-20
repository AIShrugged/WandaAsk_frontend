import Link from 'next/link';

import { formatDateTime } from '@/features/agents/lib/format';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';

import type { AgentProfile } from '@/features/agents/model/types';

/**
 *
 * @param root0
 * @param root0.profiles
 */
export function AgentProfilesList({ profiles }: { profiles: AgentProfile[] }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[900px] text-sm'>
        <thead className='bg-accent/30 text-left text-muted-foreground'>
          <tr>
            <th className='px-4 py-3 font-medium'>Name</th>
            <th className='px-4 py-3 font-medium'>Description</th>
            <th className='px-4 py-3 font-medium'>Allowed tools</th>
            <th className='px-4 py-3 font-medium'>Sandbox</th>
            <th className='px-4 py-3 font-medium'>Model</th>
            <th className='px-4 py-3 font-medium'>Updated</th>
            <th className='px-4 py-3 font-medium'>Created</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            return (
              <tr
                key={profile.id}
                className='border-b border-border/60 align-top text-foreground'
              >
                <td className='px-4 py-3'>
                  <Link
                    href={`${ROUTES.DASHBOARD.AGENT_PROFILES}/${profile.id}`}
                    className='font-medium text-primary hover:underline'
                  >
                    {profile.name}
                  </Link>
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {profile.description || '—'}
                </td>
                <td className='px-4 py-3'>
                  <div className='flex flex-wrap gap-2'>
                    {(profile.allowed_tools ?? []).length > 0 ? (
                      profile.allowed_tools?.map((tool) => {
                        return <Badge key={tool}>{tool}</Badge>;
                      })
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </div>
                </td>
                <td className='px-4 py-3'>{profile.sandbox_profile || '—'}</td>
                <td className='px-4 py-3'>{profile.model ?? '—'}</td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(profile.updated_at)}
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(profile.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
