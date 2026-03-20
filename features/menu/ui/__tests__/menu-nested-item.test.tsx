/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, fireEvent } from '@testing-library/react';

import { NestedMenuItem } from '@/features/menu/ui/menu-nested-item';

import type { MenuProps } from '@/features/menu/model/types';

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
    usePathname: () => {
      return '/';
    },
  };
});

jest.mock('motion/react-client', () => {
  return {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
      return <div {...props}>{children}</div>;
    },
  };
});

jest.mock('@/features/menu/lib/options', () => {
  return {
    ICONS_MAP: {},
  };
});

const makeItem = (overrides: Partial<MenuProps> = {}): MenuProps => {
  return {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    ...overrides,
  };
};

describe('NestedMenuItem', () => {
  it('renders the item label', () => {
    render(<NestedMenuItem item={makeItem()} level={0} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders a link when item has href and no children', () => {
    render(
      <NestedMenuItem item={makeItem({ href: '/dashboard' })} level={0} />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard');
  });

  it('does not render a link for parent with children (collapsed)', () => {
    render(
      <NestedMenuItem
        item={makeItem({
          href: '/parent',
          children: [makeItem({ id: 'child', label: 'Child', href: '/child' })],
        })}
        level={0}
      />,
    );
    // Parent has children so it renders as a div, not a link — children are collapsed
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows children after clicking parent', () => {
    render(
      <NestedMenuItem
        item={makeItem({
          id: 'parent',
          label: 'Settings',
          href: '/settings',
          children: [
            makeItem({
              id: 'child',
              label: 'Profile',
              href: '/settings/profile',
            }),
          ],
        })}
        level={0}
      />,
    );
    // Children not visible initially
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    // Click parent to expand
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('applies deeper padding for nested level', () => {
    const { container } = render(
      <NestedMenuItem item={makeItem()} level={2} />,
    );

    const clickable = container.querySelector(
      '[style*="padding-left"]',
    ) as HTMLElement;

    expect(clickable).not.toBeNull();
    // level=2 → paddingLeft = 2*16+16 = 48px
    expect(clickable.style.paddingLeft).toBe('48px');
  });
});
