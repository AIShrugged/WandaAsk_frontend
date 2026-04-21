'use client';

import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SortableItem } from './sortable-item';

import type {
  ZoneId,
  Zones,
} from '@/features/user-profile/model/menu-settings';

export interface ZoneDropAreaProps {
  zoneId: ZoneId;
  label: string;
  description: string;
  items: Zones[ZoneId];
  onToggleVisibility: (id: string, zone: ZoneId) => void;
  activeId: string | null;
}

export function ZoneDropArea({
  zoneId,
  label,
  description,
  items,
  onToggleVisibility,
  activeId,
}: ZoneDropAreaProps) {
  return (
    <div className='flex flex-col gap-2'>
      <div>
        <h3 className='text-sm font-semibold text-foreground'>{label}</h3>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <SortableContext
        items={items.map((i) => {
          return i.id;
        })}
        strategy={verticalListSortingStrategy}
      >
        <div className='flex flex-col gap-1 min-h-[48px] rounded-md p-1 border border-dashed border-white/10'>
          {items.length === 0 && (
            <div className='flex items-center justify-center h-10 text-xs text-muted-foreground'>
              Drag items here
            </div>
          )}
          {items.map((item) => {
            return (
              <SortableItem
                key={item.id}
                item={item}
                zone={zoneId}
                onToggleVisibility={onToggleVisibility}
                isDragging={activeId === item.id}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}
