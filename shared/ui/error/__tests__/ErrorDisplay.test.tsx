/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, fireEvent } from '@testing-library/react';

import ErrorDisplay from '@/shared/ui/error/ErrorDisplay';

import type { RichError } from '@/shared/ui/error/ErrorDisplay';

jest.mock('sonner', () => {
  return {
    toast: { success: jest.fn(), error: jest.fn() },
  };
});

// Silence console logging from the useEffect in ErrorDisplay
beforeAll(() => {
  jest.spyOn(console, 'group').mockImplementation(() => {});
  jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

const makeError = (overrides: Partial<RichError> = {}): RichError => {
  return {
    message: 'Something broke',
    ...overrides,
  };
};

// In Jest (NODE_ENV=test, NEXT_PUBLIC_APP_ENV undefined) → isDev is false → ProdErrorView
describe('ErrorDisplay', () => {
  it('shows friendly heading', () => {
    render(<ErrorDisplay error={makeError()} reset={jest.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows "Try again" button', () => {
    render(<ErrorDisplay error={makeError()} reset={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', () => {
    const reset = jest.fn();

    render(<ErrorDisplay error={makeError()} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not expose raw error message in production', () => {
    render(
      <ErrorDisplay
        error={makeError({ message: 'secret_db_error' })}
        reset={jest.fn()}
      />,
    );
    expect(screen.queryByText('secret_db_error')).not.toBeInTheDocument();
  });

  it('renders an error icon', () => {
    const { container } = render(
      <ErrorDisplay error={makeError()} reset={jest.fn()} />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows support message', () => {
    render(<ErrorDisplay error={makeError()} reset={jest.fn()} />);
    expect(screen.getByText(/contact support/i)).toBeInTheDocument();
  });
});
