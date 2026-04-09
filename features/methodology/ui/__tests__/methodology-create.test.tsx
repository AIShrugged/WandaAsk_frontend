import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MethodologyCreate from '@/features/methodology/ui/methodology-create';

const mockPush = jest.fn();
const mockCreateChat = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('@/features/chat/api/chats', () => {
  return {
    createChat: (...args: unknown[]) => {
      return mockCreateChat(...args);
    },
  };
});

jest.mock('@/shared/ui/button/Button', () => {
  return {
    Button: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      return <button {...props}>{children}</button>;
    },
  };
});

describe('MethodologyCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a button', () => {
    render(<MethodologyCreate />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('button shows add methodology text', () => {
    render(<MethodologyCreate />);
    expect(
      screen.getByRole('button', { name: /add methodology/i }),
    ).toBeInTheDocument();
  });

  it('creates a chat and navigates on click', async () => {
    const user = userEvent.setup();

    mockCreateChat.mockResolvedValueOnce({ id: 42 });

    render(<MethodologyCreate />);

    await user.click(screen.getByRole('button', { name: /add methodology/i }));

    expect(mockCreateChat).toHaveBeenCalledWith({
      title: 'Методология оценки',
    });
    expect(mockPush).toHaveBeenCalledWith(
      '/dashboard/chat/42?prompt=%D0%9F%D0%BE%D0%BC%D0%BE%D0%B3%D0%B8%20%D1%81%D0%BE%D0%B7%D0%B4%D0%B0%D1%82%D1%8C%20%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D1%8E%20%D0%BE%D1%86%D0%B5%D0%BD%D0%BA%D0%B8%20%D1%81%D0%BE%D1%82%D1%80%D1%83%D0%B4%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2',
    );
  });
});
