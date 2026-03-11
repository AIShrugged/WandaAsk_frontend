import { ICONS_MAP, MENU_ITEMS } from '@/features/menu/lib/options';

describe('MENU_ITEMS', () => {
  it('contains at least 4 items', () => {
    expect(MENU_ITEMS.length).toBeGreaterThanOrEqual(4);
  });

  it('each item has id, label, icon and href', () => {
    for (const item of MENU_ITEMS) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.href).toBeTruthy();
    }
  });

  it('all ids are unique', () => {
    const ids = MENU_ITEMS.map((item) => {
      return item.id;
    });

    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes an AI Chat item pointing to the chat route', () => {
    const chatItem = MENU_ITEMS.find((item) => {
      return item.id === 'chat';
    });

    expect(chatItem).toBeDefined();
    expect(chatItem?.label).toBe('AI Chat');
    expect(chatItem?.href).toBeTruthy();
  });

  it('includes a Teams item', () => {
    const teamsItem = MENU_ITEMS.find((item) => {
      return item.id === 'teams';
    });

    expect(teamsItem).toBeDefined();
    expect(teamsItem?.label).toBe('Teams');
  });

  it('includes a Methodologies item', () => {
    const item = MENU_ITEMS.find((m) => {
      return m.id === 'methodology';
    });

    expect(item).toBeDefined();
    expect(item?.label).toBe('Methodologies');
  });

  it('all hrefs are non-empty strings', () => {
    for (const item of MENU_ITEMS) {
      expect(typeof item.href).toBe('string');
      expect(item.href.length).toBeGreaterThan(0);
    }
  });
});

describe('ICONS_MAP', () => {
  it('has an entry for each icon key', () => {
    const keys = [
      'teams',
      'bookOpen',
      'calendar',
      'file',
      'kanban',
      'messageSquare',
    ] as const;

    for (const key of keys) {
      expect(ICONS_MAP[key]).toBeDefined();
    }
  });

  it('each icon value is defined (valid component reference)', () => {
    for (const icon of Object.values(ICONS_MAP)) {
      expect(icon).toBeDefined();
      // React components may be functions or objects (forwardRef)
      expect(['function', 'object'].includes(typeof icon)).toBe(true);
    }
  });

  it('all MENU_ITEMS icon keys exist in ICONS_MAP', () => {
    for (const item of MENU_ITEMS) {
      expect(ICONS_MAP[item.icon as keyof typeof ICONS_MAP]).toBeDefined();
    }
  });
});
