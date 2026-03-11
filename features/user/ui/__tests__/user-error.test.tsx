/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('lucide-react', () => {
  return {
    DatabaseZap: () => {
      return <span data-testid='database-zap' />;
    },
    UserRoundX: () => {
      return <span data-testid='user-round-x' />;
    },
  };
});

import UserError from '@/features/user/ui/user-error';

describe('UserError', () => {
  it('renders the server error message', () => {
    render(<UserError />);
    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });

  it('renders the server error icon', () => {
    render(<UserError />);
    expect(screen.getByTestId('database-zap')).toBeInTheDocument();
  });
});
