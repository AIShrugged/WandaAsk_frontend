'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updateUserPreferences } from '@/features/user-profile/api/preferences';
import {
  buildInitialZones,
  findItemZone,
  toggleVisibility,
  zonesToPreferences,
  type Zones,
} from '@/features/user-profile/model/menu-settings';

import { DragOverlayItem } from './menu-settings/drag-overlay-item';
import { ZoneDropArea } from './menu-settings/zone-drop-area';

import type { UserMenuPreferences } from '@/entities/user';
import type { MenuProps } from '@/features/menu/model/types';

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
  const [, startTransition] = useTransition();

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

  const saveZones = (currentZones: Zones) => {
    startTransition(async () => {
      const result = await updateUserPreferences({
        menu: zonesToPreferences(currentZones),
      });
      if (result.error) toast.error(result.error);
    });
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;

    const activeZone = findItemZone(zones, String(active.id));
    const overZone = findItemZone(zones, String(over.id));

    if (!activeZone || !overZone || activeZone === overZone) return;

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

    if (!over) return;

    const activeZone = findItemZone(zones, String(active.id));
    const overZone = findItemZone(zones, String(over.id));

    if (!activeZone || !overZone || activeZone !== overZone) {
      // Cross-zone move already applied in handleDragOver — save current state
      saveZones(zones);
      return;
    }

    const items = zones[activeZone];
    const oldIndex = items.findIndex((i) => {
      return i.id === String(active.id);
    });
    const newIndex = items.findIndex((i) => {
      return i.id === String(over.id);
    });

    if (oldIndex === newIndex) {
      saveZones(zones);
    } else {
      const next = {
        ...zones,
        [activeZone]: arrayMove(zones[activeZone], oldIndex, newIndex),
      };
      setZones(next);
      saveZones(next);
    }
  };

  const handleToggleVisibility = (
    id: string,
    zone: Parameters<typeof toggleVisibility>[2],
  ) => {
    const next = toggleVisibility(zones, id, zone);
    setZones(next);
    saveZones(next);
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
    </div>
  );
}
