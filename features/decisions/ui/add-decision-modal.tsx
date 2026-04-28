'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createDecision } from '@/features/decisions/api/decisions';
import {
  decisionCreateSchema,
  type DecisionCreateFormData,
} from '@/features/decisions/model/schemas';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';
import Textarea from '@/shared/ui/input/textarea';
import { Modal } from '@/shared/ui/modal/modal';

interface Props {
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function AddDecisionModal({
  teamId,
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DecisionCreateFormData>({
    resolver: zodResolver(decisionCreateSchema),
  });

  const handleClose = () => {
    reset();
    setRootError('');
    onClose();
  };

  const onSubmit = (data: DecisionCreateFormData) => {
    setRootError('');

    startTransition(async () => {
      const result = await createDecision(teamId, {
        text: data.text,
        topic: data.topic ?? null,
      });

      if (result.error) {
        setRootError(result.error);

        return;
      }

      toast.success('Decision saved');
      reset();
      onCreated?.();
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='Add decision'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col gap-4 p-4'
      >
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-foreground'>
            Decision text
          </label>
          <Textarea
            {...register('text')}
            placeholder='Describe the decision made by the team...'
            rows={4}
            error={errors.text?.message}
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-foreground'>
            Topic{' '}
            <span className='text-muted-foreground font-normal'>
              (optional)
            </span>
          </label>
          <Input
            {...register('topic')}
            value={watch('topic') ?? ''}
            placeholder='Short topic label, e.g. "Tech stack choice"'
            error={errors.topic?.message}
          />
        </div>
        {rootError && <p className='text-sm text-destructive'>{rootError}</p>}
        <div className='flex justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant={BUTTON_VARIANT.secondary}
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Saving…' : 'Save decision'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
