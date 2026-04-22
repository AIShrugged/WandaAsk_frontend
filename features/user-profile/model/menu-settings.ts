import type { UserMenuPreferences } from '@/entities/user';
import type { MenuProps } from '@/features/menu/model/types';

export type ZoneId = 'primary' | 'secondary' | 'hidden';

export interface Zones {
  primary: MenuProps[];
  secondary: MenuProps[];
  hidden: MenuProps[];
}

export const DEFAULT_PRIMARY_IDS: ReadonlySet<string> = new Set([
  'today',
  'meetings',
  'issues',
  'teams',
]);

export function buildInitialZones(
  allItems: MenuProps[],
  prefs?: UserMenuPreferences | null,
): Zones {
  if (!prefs) {
    return {
      primary: allItems.filter((item) => {
        return DEFAULT_PRIMARY_IDS.has(item.id);
      }),
      secondary: allItems.filter((item) => {
        return !DEFAULT_PRIMARY_IDS.has(item.id);
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
      if (!pref.visible) continue;
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

export function zonesToPreferences(zones: Zones): UserMenuPreferences {
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

export function findItemZone(zones: Zones, id: string): ZoneId | null {
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

export function toggleVisibility(
  zones: Zones,
  id: string,
  zone: ZoneId,
): Zones {
  if (zone === 'hidden') {
    const item = zones.hidden.find((i) => {
      return i.id === id;
    });
    if (!item) return zones;
    return {
      ...zones,
      hidden: zones.hidden.filter((i) => {
        return i.id !== id;
      }),
      secondary: [...zones.secondary, item],
    };
  }

  const item = zones[zone].find((i) => {
    return i.id === id;
  });
  if (!item) return zones;
  return {
    ...zones,
    [zone]: zones[zone].filter((i) => {
      return i.id !== id;
    }),
    hidden: [...zones.hidden, item],
  };
}
