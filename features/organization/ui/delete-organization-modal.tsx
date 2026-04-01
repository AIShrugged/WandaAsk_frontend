'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteOrganization } from '@/features/organization/api/organization';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/modal';

import type { OrganizationProps } from '@/entities/organization';

interface DeleteOrganizationModalProps {
  org: OrganizationProps;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DeleteOrganizationModal component.
 * @param props - Component props.
 * @param props.org - Organization to delete.
 * @param props.isOpen - Whether the modal is open.
 * @param props.onClose - Callback to close the modal.
 */
export function DeleteOrganizationModal({
  org,
  isOpen,
  onClose,
}: DeleteOrganizationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmValue, setConfirmValue] = useState('');

  const isConfirmed = confirmValue === org.name;

  const handleClose = () => {
    if (isPending) return;
    setConfirmValue('');
    onClose();
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteOrganization(org.id);

      if (result.error) {
        toast.error(result.error);

        return;
      }

      toast.success(`"${org.name}" has been deleted`);
      onClose();
      router.push(ROUTES.AUTH.ORGANIZATION);
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='Delete Organization'>
      <div className='flex flex-col gap-4'>
        <p className='text-sm text-muted-foreground'>
          This will permanently delete{' '}
          <span className='font-semibold text-foreground'>{org.name}</span> and
          all of its teams, members, and data. This action cannot be undone.
        </p>

        <div className='flex flex-col gap-2'>
          <label
            htmlFor='confirm-org-name'
            className='text-sm font-medium text-foreground'
          >
            Type <span className='font-mono text-destructive'>{org.name}</span>{' '}
            to confirm
          </label>
          <input
            id='confirm-org-name'
            type='text'
            value={confirmValue}
            onChange={(e) => {
              setConfirmValue(e.target.value);
            }}
            disabled={isPending}
            placeholder={org.name}
            className='h-10 w-full rounded-[var(--radius-button)] border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
          />
        </div>

        <div className='flex flex-col gap-2 pt-2'>
          <Button
            type='button'
            variant='danger'
            disabled={!isConfirmed || isPending}
            loading={isPending}
            loadingText='Deleting...'
            onClick={handleDelete}
          >
            Delete Organization
          </Button>
          <Button
            type='button'
            variant='secondary'
            disabled={isPending}
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
