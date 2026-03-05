'use server';

import { ChevronRight } from 'lucide-react';

import { selectOrganizationAction } from '@/features/organization/api/organization';
import { H3 } from '@/shared/ui/typography/H3';

import type { OrganizationProps } from '@/entities/organization';

/**
 * OrganizationList component.
 * @param root0
 * @param root0.organizations
 */
export default async function OrganizationList({
  organizations,
}: {
  organizations: OrganizationProps[];
}) {
  if (!organizations) return 'still no organizations';

  return (
    <div className='h-[280px] overflow-y-scroll'>
      {organizations.map((organization) => {
        return (
          <form key={organization.id} action={selectOrganizationAction}>
            <input
              type='hidden'
              name='organization_id'
              value={organization.id}
            />

            <button type='submit' className='cursor-pointer w-full text-left'>
              <div className='flex flex-row justify-between items-center border-b border-border cursor-pointer py-4'>
                <div className='flex flex-col justify-between gap-2'>
                  <H3>{organization.name}</H3>
                  <p className='text-sm text-muted-foreground'>
                    Your role: {organization.pivot.role}
                  </p>
                </div>
                <ChevronRight className='text-primary size-6' />
              </div>
            </button>
          </form>
        );
      })}
    </div>
  );
}
