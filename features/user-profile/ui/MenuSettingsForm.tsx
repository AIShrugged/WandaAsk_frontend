'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ICONS_MAP } from '@/features/menu/lib/options';
import { updateUserPreferences } from '@/features/user-profile/api/preferences';

import type { UserMenuPreferences } from '@/entities/user';
import type { MenuProps } from '@/features/menu/model/types';

type ZoneId = 'primary' | 'secondary' | 'hidden';

interface Zones {
  primary: MenuProps[];
  secondary: MenuProps[];
  hidden: MenuProps[];
}

function buildInitialZones(
  allItems: MenuProps[],
  prefs?: UserMenuPreferences | null,
): Zones {
  if (!prefs) {
    const DEFAULT_PRIMARY = new Set([
      'today',
      'meetings',
      'issues',
      'teams',
      'main-dashboard',
    ]);
    return {
      primary: allItems.filter((item) => {
        return DEFAULT_PRIMARY.has(item.id);
      }),
      secondary: allItems.filter((item) => {
        return !DEFAULT_PRIMARY.has(item.id);
      }),
      hidden: [],
    };
  }

  const byId = new Map(
    allItems.map((item) => {
      return [item.id, item];
    }),
  );
  const placed = new Set<string>();

  const hidden: MenuProps[] = [];
  const allPrefItems = [...(prefs.primary ?? []), ...(prefs.secondary ?? [])];
  for (const pref of allPrefItems) {
    if (!pref.visible) {
      const item = byId.get(pref.id);
      if (item && !placed.has(pref.id)) {
        hidden.push(item);
        placed.add(pref.id);
      }
    }
  }

  const resolve = (
    prefItems: { id: string; visible: boolean }[],
  ): MenuProps[] => {
    const result: MenuProps[] = [];
    for (const pref of prefItems) {
      if (!pref.visible) {
        continue;
      }
      const item = byId.get(pref.id);
      if (item) {
        result.push(item);
        placed.add(pref.id);
      }
    }
    return result;
  };

  const primary = resolve(prefs.primary ?? []);
  const secondary = resolve(prefs.secondary ?? []);

  for (const item of allItems) {
    if (!placed.has(item.id)) {
      secondary.push(item);
    }
  }

  return { primary, secondary, hidden };
}

function zonesToPreferences(zones: Zones): UserMenuPreferences {
  return {
    primary: zones.primary.map((item) => {
      return { id: item.id, visible: true };
    }),
    secondary: [
      ...zones.secondary.map((item) => {
        return { id: item.id, visible: true };
      }),
      ...zones.hidden.map((item) => {
        return { id: item.id, visible: false };
      }),
    ],
  };
}

function findItemZone(zones: Zones, id: string): ZoneId | null {
  for (const zone of ['primary', 'secondary', 'hidden'] as ZoneId[]) {
    if (
      zones[zone].some((item) => {
        return item.id === id;
      })
    ) {
      return zone;
    }
  }
  return null;
}

interface SortableItemProps {
  item: MenuProps;
  zone: ZoneId;
  onToggleVisibility: (id: string, zone: ZoneId) => void;
  isDragging?: boolean;
}

function SortableItem({
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

function DragOverlayItem({ item }: { item: MenuProps }) {
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

interface ZoneDropAreaProps {
  zoneId: ZoneId;
  label: string;
  description: string;
  items: MenuProps[];
  onToggleVisibility: (id: string, zone: ZoneId) => void;
  activeId: string | null;
}

function ZoneDropArea({
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

export interface MenuSettingsFormProps {
  allItems: MenuProps[];
  initialPrefs?: UserMenuPreferences | null;
}

export function MenuSettingsForm({
  allItems,
  initialPrefs,
}: MenuSettingsFormProps) {
  const [zones, setZones] = useState<Zones>(() => {
    return buildInitialZones(allItems, initialPrefs);
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeItem = activeId
    ? (allItems.find((item) => {
        return item.id === activeId;
      }) ?? null)
    : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      return;
    }

    const activeZone = findItemZone(zones, String(active.id));
    const overZone = findItemZone(zones, String(over.id));

    if (!activeZone || !overZone || activeZone === overZone) {
      return;
    }

    setZones((prev) => {
      const activeItems = [...prev[activeZone]];
      const overItems = [...prev[overZone]];

      const activeIndex = activeItems.findIndex((i) => {
        return i.id === String(active.id);
      });
      const overIndex = overItems.findIndex((i) => {
        return i.id === String(over.id);
      });

      const [moved] = activeItems.splice(activeIndex, 1);
      overItems.splice(
        overIndex === -1 ? overItems.length : overIndex,
        0,
        moved,
      );

      return { ...prev, [activeZone]: activeItems, [overZone]: overItems };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);

    if (!over) {
      return;
    }

    const activeZone = findItemZone(zones, String(active.id));
    const overZone = findItemZone(zones, String(over.id));

    if (!activeZone || !overZone || activeZone !== overZone) {
      return;
    }

    const items = zones[activeZone];
    const oldIndex = items.findIndex((i) => {
      return i.id === String(active.id);
    });
    const newIndex = items.findIndex((i) => {
      return i.id === String(over.id);
    });

    if (oldIndex !== newIndex) {
      setZones((prev) => {
        return {
          ...prev,
          [activeZone]: arrayMove(prev[activeZone], oldIndex, newIndex),
        };
      });
    }
  };

  const handleToggleVisibility = (id: string, zone: ZoneId) => {
    setZones((prev) => {
      if (zone === 'hidden') {
        const item = prev.hidden.find((i) => {
          return i.id === id;
        });
        if (!item) {
          return prev;
        }
        return {
          ...prev,
          hidden: prev.hidden.filter((i) => {
            return i.id !== id;
          }),
          secondary: [...prev.secondary, item],
        };
      }

      const item = prev[zone].find((i) => {
        return i.id === id;
      });
      if (!item) {
        return prev;
      }
      return {
        ...prev,
        [zone]: prev[zone].filter((i) => {
          return i.id !== id;
        }),
        hidden: [...prev.hidden, item],
      };
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateUserPreferences({
        menu: zonesToPreferences(zones),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Menu preferences saved');
      }
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ZoneDropArea
          zoneId='primary'
          label='Primary'
          description='Shown above the divider in the sidebar'
          items={zones.primary}
          onToggleVisibility={handleToggleVisibility}
          activeId={activeId}
        />

        <ZoneDropArea
          zoneId='secondary'
          label='Secondary'
          description='Shown below the divider in the sidebar'
          items={zones.secondary}
          onToggleVisibility={handleToggleVisibility}
          activeId={activeId}
        />

        <ZoneDropArea
          zoneId='hidden'
          label='Hidden'
          description='Not shown in the sidebar'
          items={zones.hidden}
          onToggleVisibility={handleToggleVisibility}
          activeId={activeId}
        />

        <DragOverlay>
          {activeItem ? <DragOverlayItem item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <button
        onClick={handleSave}
        disabled={isPending}
        className='self-start px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
