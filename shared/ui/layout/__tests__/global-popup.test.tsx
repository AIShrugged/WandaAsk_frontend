import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import GlobalPopup from '@/shared/ui/layout/global-popup';

/**
 * Helper: dispatch the open-global-popup custom event.
 * @param anchorEl
 * @param content
 * @param width
 */
function openPopup(
  anchorEl: HTMLElement,
  content: React.ReactNode,
  width?: number,
) {
  act(() => {
    globalThis.dispatchEvent(
      new CustomEvent('open-global-popup', {
        detail: { anchorEl, content, width },
      }),
    );
  });
}

/**
 * Helper: dispatch the close-global-popup custom event.
 */
function closePopup() {
  act(() => {
    globalThis.dispatchEvent(new CustomEvent('close-global-popup'));
  });
}

describe('GlobalPopup', () => {
  it('renders nothing by default', () => {
    const { container } = render(<GlobalPopup />);

    expect(container.firstChild).toBeNull();
  });

  it('shows content after open-global-popup event', async () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 0,
        bottom: 40,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <span>Popup content</span>);
    expect(screen.getByText('Popup content')).toBeInTheDocument();

    anchor.remove();
  });

  it('hides content after close-global-popup event', async () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 0,
        bottom: 40,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <span>Should disappear</span>);
    expect(screen.getByText('Should disappear')).toBeInTheDocument();

    closePopup();
    expect(screen.queryByText('Should disappear')).not.toBeInTheDocument();

    anchor.remove();
  });

  it('closes when clicking outside', async () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 0,
        bottom: 40,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <span>Click outside</span>);
    expect(screen.getByText('Click outside')).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByText('Click outside')).not.toBeInTheDocument();

    anchor.remove();
  });

  it('positions the popup below the anchor element', () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 100,
        bottom: 140,
        left: 50,
        right: 150,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <span>Positioned popup</span>, 200);
    const popup = screen
      .getByText('Positioned popup')
      .closest('div') as HTMLElement;

    expect(popup.style.position).toBe('fixed');
    expect(popup.style.top).toBe('148px'); // bottom(140) + 8
    expect(popup.style.width).toBe('200px');

    anchor.remove();
  });

  it('accepts string width', () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 0,
        bottom: 40,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <span>Wide popup</span>);
    const popup = screen.getByText('Wide popup').closest('div') as HTMLElement;

    expect(popup.style.width).toBe('');

    anchor.remove();
  });

  it('replaces popup content on second open event', () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 0,
        bottom: 40,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <span>First</span>);
    openPopup(anchor, <span>Second</span>);
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    anchor.remove();
  });

  it('does not close when clicking inside popup', async () => {
    render(<GlobalPopup />);
    const anchor = document.createElement('button');

    document.body.append(anchor);
    anchor.getBoundingClientRect = () => {
      return {
        top: 0,
        bottom: 40,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      } as DOMRect;
    };

    openPopup(anchor, <button>Inside button</button>);
    await userEvent.click(
      screen.getByRole('button', { name: 'Inside button' }),
    );
    expect(
      screen.getByRole('button', { name: 'Inside button' }),
    ).toBeInTheDocument();

    anchor.remove();
  });

  it('removes event listeners on unmount', () => {
    const removeSpy = jest.spyOn(globalThis, 'removeEventListener');
    const { unmount } = render(<GlobalPopup />);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      'open-global-popup',
      expect.any(Function),
    );
    expect(removeSpy).toHaveBeenCalledWith(
      'close-global-popup',
      expect.any(Function),
    );
    removeSpy.mockRestore();
  });
});
