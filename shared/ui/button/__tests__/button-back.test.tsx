import { render, screen, fireEvent } from '@testing-library/react';

import ButtonBack from '@/shared/ui/button/button-back';

const mockBack = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { back: mockBack };
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ButtonBack', () => {
  it('renders a button with accessible label', () => {
    render(<ButtonBack />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('calls router.back when clicked', () => {
    render(<ButtonBack />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders a chevron icon', () => {
    const { container } = render(<ButtonBack />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
