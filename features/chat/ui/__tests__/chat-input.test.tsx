import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatInput } from '@/features/chat/ui/chat-input';

describe('ChatInput', () => {
  it('renders a textarea', () => {
    render(<ChatInput onSend={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders a send button', () => {
    render(<ChatInput onSend={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it('send button is disabled initially (empty input)', () => {
    render(<ChatInput onSend={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeDisabled();
  });

  it('send button enables after typing', async () => {
    render(<ChatInput onSend={jest.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'Hello');
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).not.toBeDisabled();
  });

  it('calls onSend with trimmed content on button click', async () => {
    const onSend = jest.fn();

    render(<ChatInput onSend={onSend} />);
    await userEvent.type(screen.getByRole('textbox'), '  Hello world  ');
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('clears input after send', async () => {
    render(<ChatInput onSend={jest.fn()} />);
    const textarea = screen.getByRole('textbox');

    await userEvent.type(textarea, 'Test message');
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(textarea).toHaveValue('');
  });

  it('sends on Enter key press', async () => {
    const onSend = jest.fn();

    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByRole('textbox');

    await userEvent.type(textarea, 'Hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send on Shift+Enter', async () => {
    const onSend = jest.fn();

    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByRole('textbox');

    await userEvent.type(textarea, 'Hello{Shift>}{Enter}{/Shift}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables textarea and button when disabled prop is true', () => {
    render(<ChatInput onSend={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeDisabled();
  });

  it('does not send empty or whitespace-only input', async () => {
    const onSend = jest.fn();

    render(<ChatInput onSend={onSend} />);
    await userEvent.type(screen.getByRole('textbox'), '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });
});
