import { render, screen } from '@testing-library/react';

import MethodologyDeleteModal from '@/features/methodology/ui/methodology-delete-modal';

import type { MethodologyProps } from '@/features/methodology/model/types';

jest.mock('@/shared/ui/modal/modal-header', () => {
  return {
    __esModule: true,
    default: ({ title }: { title: string }) => {
      return <div data-testid='modal-header'>{title}</div>;
    },
  };
});

jest.mock('@/shared/ui/modal/modal-body', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
  };
});

jest.mock('@/shared/ui/modal/modal-footer', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
  };
});

const makeMethodology = (): MethodologyProps => {
  return {
    id: 5,
    name: 'Sprint Review',
    text: 'Description',
    organization_id: 'org-1',
    team_ids: [],
    is_default: false,
    teams: [],
  };
};

describe('MethodologyDeleteModal', () => {
  it('renders delete title in header', () => {
    render(
      <MethodologyDeleteModal
        close={jest.fn()}
        methodology={makeMethodology()}
      />,
    );
    expect(screen.getByTestId('modal-header')).toHaveTextContent(
      'Delete methodology?',
    );
  });

  it('renders methodology name in confirmation text', () => {
    render(
      <MethodologyDeleteModal
        close={jest.fn()}
        methodology={makeMethodology()}
      />,
    );
    expect(screen.getByText(/Sprint Review/)).toBeInTheDocument();
  });

  it('renders Delete button', () => {
    render(
      <MethodologyDeleteModal
        close={jest.fn()}
        methodology={makeMethodology()}
      />,
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('Delete button is disabled', () => {
    render(
      <MethodologyDeleteModal
        close={jest.fn()}
        methodology={makeMethodology()}
      />,
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });
});
