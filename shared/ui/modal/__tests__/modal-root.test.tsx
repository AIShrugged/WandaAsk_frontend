import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('framer-motion', () => {
  return {
    motion: {
      div: ({
        children,
        onClick,
        ...rest
      }: React.HTMLAttributes<HTMLDivElement> & {
        children?: React.ReactNode;
      }) => {
        return (
          <div onClick={onClick} {...rest}>
            {children}
          </div>
        );
      },
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

import { ModalRoot } from '@/shared/ui/modal/modal-root';

describe('ModalRoot', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when open', () => {
    render(
      <ModalRoot open onClose={onClose}>
        <p>Modal content</p>
      </ModalRoot>,
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders nothing inside the portal when closed', () => {
    render(
      <ModalRoot open={false} onClose={onClose}>
        <p>Hidden content</p>
      </ModalRoot>,
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed while open', async () => {
    render(
      <ModalRoot open onClose={onClose}>
        <p>Content</p>
      </ModalRoot>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closed', async () => {
    render(
      <ModalRoot open={false} onClose={onClose}>
        <p>Content</p>
      </ModalRoot>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(
      <ModalRoot open onClose={onClose}>
        <p>Clickable backdrop</p>
      </ModalRoot>,
    );
    // The outer motion.div has onClick={onClose}
    const backdrop = screen
      .getByText('Clickable backdrop')
      .closest('[class*="fixed inset-0"]') as HTMLElement;

    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not propagate click from inner content to backdrop', async () => {
    render(
      <ModalRoot open onClose={onClose}>
        <button>Inner button</button>
      </ModalRoot>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Inner button' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes keydown listener on unmount', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(
      <ModalRoot open onClose={onClose}>
        <p>Content</p>
      </ModalRoot>,
    );

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
