'use client';

import { GripVertical } from 'lucide-react';

import { ICONS_MAP } from '@/features/menu/lib/options';

import type { MenuProps } from '@/features/menu/model/types';

export function DragOverlayItem({ item }: { item: MenuProps }) {
  const Icon = item.icon ? ICONS_MAP[item.icon] : null;
  return (
    <div className='flex items-center gap-3 px-3 py-2 rounded-md bg-sidebar border border-primary/50 shadow-lg'>
      <GripVertical className='w-4 h-4 text-muted-foreground' />
      {Icon && <Icon className='w-4 h-4 text-muted-foreground shrink-0' />}
      <span className='flex-1 text-sm font-medium text-foreground'>
        {item.label}
      </span>
    </div>
  );
}
