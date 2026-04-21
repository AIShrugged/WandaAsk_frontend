'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical } from 'lucide-react';

import { ICONS_MAP } from '@/features/menu/lib/options';

import type { MenuProps } from '@/features/menu/model/types';
import type { ZoneId } from '@/features/user-profile/model/menu-settings';

export interface SortableItemProps {
  item: MenuProps;
  zone: ZoneId;
  onToggleVisibility: (id: string, zone: ZoneId) => void;
  isDragging?: boolean;
}

export function SortableItem({
  item,
  zone,
  onToggleVisibility,
  isDragging,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Icon = item.icon ? ICONS_MAP[item.icon] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 border border-white/10 group'
    >
      <button
        {...attributes}
        {...listeners}
        className='text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing'
        aria-label='Drag to reorder'
      >
        <GripVertical className='w-4 h-4' />
      </button>

      {Icon && <Icon className='w-4 h-4 text-muted-foreground shrink-0' />}

      <span className='flex-1 text-sm font-medium text-foreground'>
        {item.label}
      </span>

      <button
        onClick={() => {
          return onToggleVisibility(item.id, zone);
        }}
        className='text-muted-foreground hover:text-foreground transition-colors'
        aria-label={zone === 'hidden' ? 'Show item' : 'Hide item'}
      >
        {zone === 'hidden' ? (
          <EyeOff className='w-4 h-4' />
        ) : (
          <Eye className='w-4 h-4' />
        )}
      </button>
    </div>
  );
}
