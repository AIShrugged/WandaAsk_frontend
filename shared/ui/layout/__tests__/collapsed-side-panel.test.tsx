import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

describe('CollapsedSidePanel', () => {
  it('renders without errors', () => {
    render(<CollapsedSidePanel label='Test' onExpand={jest.fn()} />);
  });

  it('displays the passed label', () => {
    render(<CollapsedSidePanel label='Chats' onExpand={jest.fn()} />);
    expect(screen.getByText('Chats')).toBeInTheDocument();
  });

  it('calls onExpand when the button is clicked', async () => {
    const onExpand = jest.fn();

    render(<CollapsedSidePanel label='Chats' onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('renders ChevronRight icon by default (icon="right")', () => {
    render(<CollapsedSidePanel label='Chats' onExpand={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /expand chats panel/i }),
    ).toBeInTheDocument();
  });

  it('renders ChevronLeft icon when icon="left"', () => {
    render(
      <CollapsedSidePanel label='Info' onExpand={jest.fn()} icon='left' />,
    );
    expect(
      screen.getByRole('button', { name: /expand info panel/i }),
    ).toBeInTheDocument();
  });
});
