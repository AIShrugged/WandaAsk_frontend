'use client';

import { Paperclip, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  deletePendingAttachment,
  uploadPendingAttachment,
} from '@/features/onboarding/api/attachments';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';

import type { PendingAttachment } from '../model/types';

const MAX_FILES = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface Props {
  uploadToken: string;
  attachments: PendingAttachment[];
  onUploaded: (attachment: PendingAttachment) => void;
  onDeleted: (attachmentId: number) => void;
  onPendingChange: (hasPending: boolean) => void;
}

export function OnboardingFileUpload({
  uploadToken,
  attachments,
  onUploaded,
  onDeleted,
  onPendingChange,
}: Props) {
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());

  function addOp(id: string) {
    setPendingOps((prev) => {
      const next = new Set(prev);

      next.add(id);
      onPendingChange(next.size > 0);
      return next;
    });
  }

  function removeOp(id: string) {
    setPendingOps((prev) => {
      const next = new Set(prev);

      next.delete(id);
      onPendingChange(next.size > 0);
      return next;
    });
  }

  const isBusy = pendingOps.size > 0;
  const isAtLimit = attachments.length >= MAX_FILES;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-foreground'>
          Attachments{' '}
          <span className='text-muted-foreground'>
            ({attachments.length}/{MAX_FILES})
          </span>
        </span>
        <label
          className={[
            'inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)]',
            'border border-input bg-background px-3 py-1.5 text-sm font-medium',
            'text-foreground hover:bg-accent transition-colors',
            isBusy || isAtLimit ? 'pointer-events-none opacity-50' : '',
          ].join(' ')}
        >
          <Upload className='h-3.5 w-3.5' />
          {isBusy ? 'Uploading...' : 'Add file'}
          <input
            type='file'
            className='hidden'
            accept='.pdf,.docx,.md,.txt'
            disabled={isBusy || isAtLimit}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) return;
              event.target.value = '';

              if (file.size > MAX_SIZE_BYTES) {
                toast.error('File exceeds 10 MB limit');
                return;
              }

              if (attachments.length >= MAX_FILES) {
                toast.error(`Maximum ${MAX_FILES} files allowed`);
                return;
              }

              const opId = crypto.randomUUID();

              addOp(opId);
              uploadPendingAttachment(file, uploadToken)
                .then((result) => {
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  if (result.data) onUploaded(result.data);
                })
                .catch(() => {
                  toast.error('Upload failed. Please try again.');
                })
                .finally(() => {
                  removeOp(opId);
                });
            }}
          />
        </label>
      </div>

      {attachments.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {attachments.map((attachment) => {
            return (
              <li
                key={attachment.id}
                className='flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface/40 px-3 py-2'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <Paperclip className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <span className='truncate text-sm text-foreground'>
                    {attachment.original_name ??
                      attachment.file_name ??
                      `attachment-${attachment.id}`}
                  </span>
                </div>
                <Button
                  type='button'
                  variant={BUTTON_VARIANT.secondary}
                  className='h-7 w-7 shrink-0 p-0'
                  disabled={isBusy}
                  onClick={() => {
                    const opId = crypto.randomUUID();

                    addOp(opId);
                    deletePendingAttachment(attachment.id)
                      .then((result) => {
                        if (result.error) {
                          toast.error(result.error);
                          return;
                        }
                        onDeleted(attachment.id);
                      })
                      .catch(() => {
                        toast.error('Delete failed. Please try again.');
                      })
                      .finally(() => {
                        removeOp(opId);
                      });
                  }}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
