/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockOpen = jest.fn();

const mockClose = jest.fn();

jest.mock('@/shared/hooks/use-modal', () => {
  return {
    useModal: () => {
      return { open: mockOpen, close: mockClose };
    },
  };
});

jest.mock('@/features/event/ui/event-popup-all', () => {
  return {
    EventPopupAll: () => {
      return <div data-testid='event-popup-all' />;
    },
  };
});

import EventExtraButton from '@/features/calendar/ui/event-extra-button';

import type { EventProps } from '@/entities/event';

const makeEvent = (id: number): EventProps => {
  return {
    id,
    title: `Event ${id}`,
    start: '2024-01-01T10:00:00Z',
    end: '2024-01-01T11:00:00Z',
    color: '#ff0000',
  };
};

const user = userEvent.setup({ delay: null });

describe('EventExtraButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "+N more" text', () => {
    render(<EventExtraButton count={3} dayEvents={[makeEvent(1)]} />);
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  it('calls open() with EventPopupAll when clicked', async () => {
    const events = [makeEvent(1), makeEvent(2)];

    render(<EventExtraButton count={2} dayEvents={events} />);
    await user.click(screen.getByText('+2 more'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it('displays the correct count in the label', () => {
    render(<EventExtraButton count={7} dayEvents={[]} />);
    expect(screen.getByText('+7 more')).toBeInTheDocument();
  });
});
