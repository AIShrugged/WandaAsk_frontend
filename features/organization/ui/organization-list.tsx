'use server';

import { ChevronRight } from 'lucide-react';

import { selectOrganizationAction } from '@/app/actions/organization';
import { H3 } from '@/shared/ui/typography/H3';

import type { OrganizationProps } from '@/features/organization/model/types';

export default async function OrganizationList({
  organizations,
}: {
  organizations: OrganizationProps[];
}) {
  if (!organizations) return null;

  return (
    <div className={'h-[280px] overflow-y-scroll'}>
      {organizations.map(organization => (
        <form key={organization.id} action={selectOrganizationAction}>
          <input type='hidden' name='organization_id' value={organization.id} />

          <button type='submit' className='w-full text-left'>
            <div className='flex flex-row justify-between items-center border-b-table cursor-pointer py-[18px]'>
              <div className='flex flex-col justify-between gap-[10px]'>
                <H3>{organization.name}</H3>
                <p>Your role: {organization.pivot.role}</p>
              </div>
              <ChevronRight className='text-accent size-[36px]' />
            </div>
          </button>
        </form>
      ))}
    </div>
  );
}
