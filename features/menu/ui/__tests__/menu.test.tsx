/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('framer-motion', () => {
  return {
    motion: {
      div: ({
        children,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & {
        children?: React.ReactNode;
      }) => {
        return <div {...rest}>{children}</div>;
      },
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

jest.mock('next/navigation', () => {
  return {
    useSelectedLayoutSegment: () => {
      return null;
    },
  };
});

jest.mock('lucide-react', () => {
  return {
    ChevronRight: () => {
      return <span data-testid='chevron' />;
    },
    Calendar: () => {
      return <span />;
    },
    BookOpen: () => {
      return <span />;
    },
    MessageSquare: () => {
      return <span />;
    },
    SquareKanban: () => {
      return <span />;
    },
    File: () => {
      return <span />;
    },
    UsersRound: () => {
      return <span />;
    },
  };
});

import { MenuNested } from '@/features/menu/ui/menu-nested';
import MenuSidebar from '@/features/menu/ui/menu-sidebar';

import type { MenuProps } from '@/features/menu/model/types';

const makeItem = (overrides: Partial<MenuProps> = {}): MenuProps => {
  return {
    id: 'item-1',
    label: 'Item One',
    href: '/dashboard/item',
    ...overrides,
  };
};

describe('MenuNested', () => {
  it('renders a link for each item with href', () => {
    const items = [
      makeItem({ id: 'a', label: 'Alpha', href: '/alpha' }),
      makeItem({ id: 'b', label: 'Beta', href: '/beta' }),
    ];

    render(<MenuNested items={items} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders links with correct hrefs', () => {
    render(
      <MenuNested
        items={[makeItem({ id: 'x', label: 'X', href: '/dashboard/x' })]}
      />,
    );
    expect(screen.getByRole('link', { name: /x/i })).toHaveAttribute(
      'href',
      '/dashboard/x',
    );
  });

  it('renders an empty list without errors', () => {
    const { container } = render(<MenuNested items={[]} />);

    expect(container).toBeInTheDocument();
  });

  it('renders items without href as non-link elements', () => {
    render(
      <MenuNested
        items={[makeItem({ id: 'nolink', label: 'No Link', href: undefined })]}
      />,
    );
    expect(screen.getByText('No Link')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('MenuSidebar', () => {
  it('renders inside a nav element', () => {
    render(<MenuSidebar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders all default menu items', () => {
    render(<MenuSidebar />);
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Methodologies')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Follow ups (meetings)')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });
});
