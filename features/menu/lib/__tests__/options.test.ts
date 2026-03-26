import { getMenuItems, ICONS_MAP } from '@/features/menu/lib/options';
import { ROUTES } from '@/shared/lib/routes';

describe('getMenuItems', () => {
  it('contains at least 4 items without agent management', () => {
    expect(
      getMenuItems({ canManageAgents: false }).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('each item has id, label, icon and href', () => {
    for (const item of getMenuItems({ canManageAgents: false })) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.href).toBeTruthy();
    }
  });

  it('all ids are unique', () => {
    const items = getMenuItems({ canManageAgents: true });
    const ids = items.map((item) => {
      return item.id;
    });

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes an AI Chat item pointing to the chat route', () => {
    const chatItem = getMenuItems({ canManageAgents: false }).find((item) => {
      return item.id === 'chat';
    });

    expect(chatItem).toBeDefined();
    expect(chatItem?.label).toBe('AI Chat');
    expect(chatItem?.href).toBe(ROUTES.DASHBOARD.CHAT);
  });

  it('includes a Teams item', () => {
    const teamsItem = getMenuItems({ canManageAgents: false }).find((item) => {
      return item.id === 'teams';
    });

    expect(teamsItem).toBeDefined();
    expect(teamsItem?.label).toBe('Teams');
  });

  it('includes a Methodologies item', () => {
    const item = getMenuItems({ canManageAgents: false }).find((menuItem) => {
      return menuItem.id === 'methodology';
    });

    expect(item).toBeDefined();
    expect(item?.label).toBe('Methodologies');
  });

  it('adds agent items when agent management is enabled', () => {
    const items = getMenuItems({ canManageAgents: true });

    expect(
      items.find((item) => {
        return item.id === 'agent-tasks';
      }),
    ).toBeDefined();
    expect(
      items.find((item) => {
        return item.id === 'agent-profiles';
      }),
    ).toBeDefined();
  });

  it('omits agent items when agent management is disabled', () => {
    const items = getMenuItems({ canManageAgents: false });

    expect(
      items.find((item) => {
        return item.id === 'agent-tasks';
      }),
    ).toBeUndefined();
    expect(
      items.find((item) => {
        return item.id === 'agent-profiles';
      }),
    ).toBeUndefined();
  });

  it('all hrefs are non-empty strings', () => {
    for (const item of getMenuItems({ canManageAgents: true })) {
      expect(typeof item.href).toBe('string');
      expect(item.href?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe('ICONS_MAP', () => {
  it('has an entry for each icon key', () => {
    const keys = [
      'bot',
      'teams',
      'bookOpen',
      'calendar',
      'file',
      'kanban',
      'messageSquare',
      'bug',
    ] as const;

    for (const key of keys) {
      expect(ICONS_MAP[key]).toBeDefined();
    }
  });

  it('each icon value is defined (valid component reference)', () => {
    for (const icon of Object.values(ICONS_MAP)) {
      expect(icon).toBeDefined();
      expect(['function', 'object'].includes(typeof icon)).toBe(true);
    }
  });

  it('all menu icon keys exist in ICONS_MAP', () => {
    for (const item of getMenuItems({ canManageAgents: true })) {
      expect(ICONS_MAP[item.icon as keyof typeof ICONS_MAP]).toBeDefined();
    }
  });
});
