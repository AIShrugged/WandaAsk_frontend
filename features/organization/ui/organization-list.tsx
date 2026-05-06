'use server';

import { ChevronRight } from 'lucide-react';

import { selectOrganizationAction } from '@/features/organization/api/organization';
import { Button } from '@/shared/ui/button';
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

            <Button
              type='submit'
              variant='ghost'
              justify='start'
              className='border-b border-border rounded-none py-4 px-0'
              rightIcon={
                <ChevronRight className='text-primary size-6 ml-auto' />
              }
            >
              <div className='flex flex-col gap-2'>
                <H3>{organization.name}</H3>
                <p className='text-sm text-muted-foreground'>
                  Your role: {organization.pivot.role}
                </p>
              </div>
            </Button>
          </form>
        );
      })}
    </div>
  );
}
