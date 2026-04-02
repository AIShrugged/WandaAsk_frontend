'use client';

import { Trash } from 'lucide-react';
import { useState } from 'react';

import { DeleteOrganizationModal } from '@/features/organization/ui/delete-organization-modal';
import { Button } from '@/shared/ui/button/Button';

import type { OrganizationProps } from '@/entities/organization';

interface OrganizationDangerZoneProps {
  org: OrganizationProps;
}

/**
 * OrganizationDangerZone component.
 * @param props - Component props.
 * @param props.org - Organization.
 */
export function OrganizationDangerZone({ org }: OrganizationDangerZoneProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-destructive/30 bg-destructive/5 p-4'>
        <div className='flex flex-col gap-1'>
          <h3 className='text-sm font-semibold text-destructive'>
            Danger Zone
          </h3>
          <p className='text-sm text-muted-foreground'>
            Permanently delete this organization and all its teams and data.
          </p>
        </div>

        <Button
          type='button'
          variant='ghost-danger'
          size='sm'
          className='w-fit'
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          <Trash className='size-4' />
          Delete Organization
        </Button>
      </div>

      <DeleteOrganizationModal
        org={org}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
