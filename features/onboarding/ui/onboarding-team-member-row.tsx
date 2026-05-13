'use client';

import { Trash2 } from 'lucide-react';

import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';

import type { EditableTeamMember } from '../model/types';

interface Props {
  member: EditableTeamMember;
  onUpdate: (updated: EditableTeamMember) => void;
  onRemove: () => void;
}

export function OnboardingTeamMemberRow({ member, onUpdate, onRemove }: Props) {
  return (
    <div className='grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface/40 px-3 pt-4 pb-2'>
      <Input
        label='Name'
        value={member.name}
        onChange={(e) => {
          return onUpdate({ ...member, name: e.target.value });
        }}
      />
      <Input
        label='Email'
        value={member.email ?? ''}
        onChange={(e) => {
          return onUpdate({ ...member, email: e.target.value || null });
        }}
      />
      <Input
        label='Role'
        value={member.role ?? ''}
        onChange={(e) => {
          return onUpdate({ ...member, role: e.target.value || null });
        }}
      />
      <Button
        type='button'
        variant={BUTTON_VARIANT.ghost}
        className='h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive'
        onClick={onRemove}
      >
        <Trash2 className='h-3.5 w-3.5' />
      </Button>
    </div>
  );
}
