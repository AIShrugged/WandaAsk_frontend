/* eslint-disable jsdoc/require-jsdoc */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockCreateMethodology = jest.fn().mockResolvedValue({});

const mockUpdateMethodology = jest.fn().mockResolvedValue({});

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { success: jest.fn(), error: jest.fn() },
  };
});

jest.mock('@/features/methodology/api/methodology', () => {
  return {
    createMethodology: (...args: unknown[]) => {
      return mockCreateMethodology(...args);
    },
    updateMethodology: (...args: unknown[]) => {
      return mockUpdateMethodology(...args);
    },
  };
});

// Stub VARIANT_MAPPER so we get real inputs without component dependencies
jest.mock('@/shared/lib/fieldMapper', () => {
  return {
    VARIANT_MAPPER: {
      input: ({
        field,
        fieldState,
      }: {
        field: { name: string; value: string; onChange: (v: string) => void };
        fieldState: { error?: { message: string } };
      }) => {
        return (
          <div>
            <input
              data-testid={`field-${field.name}`}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value);
              }}
            />
            {fieldState.error && (
              <span data-testid={`error-${field.name}`}>
                {fieldState.error.message}
              </span>
            )}
          </div>
        );
      },
      inputTextarea: ({
        field,
      }: {
        field: { name: string; value: string; onChange: (v: string) => void };
      }) => {
        return (
          <textarea
            data-testid={`field-${field.name}`}
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
            }}
          />
        );
      },
      multiselect: ({
        field,
      }: {
        field: {
          name: string;
          value: string[];
          onChange: (v: string[]) => void;
        };
      }) => {
        return (
          <select
            data-testid={`field-${field.name}`}
            multiple
            value={field.value}
            onChange={(e) => {
              const selected = [...e.target.selectedOptions].map((o) => {
                return o.value;
              });

              field.onChange(selected);
            }}
          >
            <option value='1'>Team A</option>
            <option value='2'>Team B</option>
          </select>
        );
      },
    },
  };
});

jest.mock('@/shared/ui/button/Button', () => {
  return {
    Button: ({
      children,
      disabled,
      loading,
    }: {
      children: React.ReactNode;
      disabled?: boolean;
      loading?: boolean;
    }) => {
      return (
        <button type='submit' disabled={disabled || loading}>
          {children}
        </button>
      );
    },
  };
});

import MethodologyForm from '@/features/methodology/ui/methodology-form';

import type { TeamProps } from '@/entities/team';
import type { MethodologyProps } from '@/features/methodology/model/types';

const ORG_ID = 'org-1';

const FIELD_NAME = 'field-name';

const FIELD_TEXT = 'field-text';

const teams: TeamProps[] = [
  { id: 1, name: 'Team A', slug: 'team-a', employee_count: 3, members: [] },
  { id: 2, name: 'Team B', slug: 'team-b', employee_count: 2, members: [] },
];

const existingMethodology: MethodologyProps = {
  id: 10,
  name: 'Agile',
  organization_id: ORG_ID,
  text: 'Follow agile practices',
  team_ids: ['1'],
  teams: [
    { id: 1, name: 'Team A', slug: 'team-a', employee_count: 3, members: [] },
  ],
};

const user = userEvent.setup({ delay: null });

describe('MethodologyForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMethodology.mockResolvedValue({});
    mockUpdateMethodology.mockResolvedValue({});
  });

  it('renders the name and text fields', () => {
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    expect(screen.getByTestId(FIELD_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(FIELD_TEXT)).toBeInTheDocument();
  });

  it('renders the Save button', () => {
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('Save button is disabled when form is pristine', () => {
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('enables Save after typing in name field', async () => {
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    await user.type(screen.getByTestId(FIELD_NAME), 'My Method');
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('pre-fills values for edit mode', () => {
    render(
      <MethodologyForm
        organization_id={ORG_ID}
        teams={teams}
        values={existingMethodology}
      />,
    );
    expect(screen.getByTestId(FIELD_NAME)).toHaveValue('Agile');
    expect(screen.getByTestId(FIELD_TEXT)).toHaveValue(
      'Follow agile practices',
    );
  });

  it('calls createMethodology on submit for new form', async () => {
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    await user.selectOptions(screen.getByTestId('field-team_ids'), ['1']);
    await user.type(screen.getByTestId(FIELD_NAME), 'New Method');
    await user.type(screen.getByTestId(FIELD_TEXT), 'Some text here');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    });
    await waitFor(() => {
      expect(mockCreateMethodology).toHaveBeenCalledTimes(1);
    });
  });

  it('calls updateMethodology on submit for edit form', async () => {
    render(
      <MethodologyForm
        organization_id={ORG_ID}
        teams={teams}
        values={existingMethodology}
      />,
    );
    await user.clear(screen.getByTestId(FIELD_NAME));
    await user.type(screen.getByTestId(FIELD_NAME), 'Updated Method');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    });
    await waitFor(() => {
      expect(mockUpdateMethodology).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ name: 'Updated Method' }),
      );
    });
  });

  it('shows error on submit failure', async () => {
    mockCreateMethodology.mockRejectedValue(new Error('Duplicate name'));
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    await user.selectOptions(screen.getByTestId('field-team_ids'), ['1']);
    await user.type(screen.getByTestId(FIELD_NAME), 'Dup');
    await user.type(screen.getByTestId(FIELD_TEXT), 'text');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    });
    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toHaveTextContent(
        'Duplicate name',
      );
    });
  });

  it('navigates to methodology list on success', async () => {
    render(<MethodologyForm organization_id={ORG_ID} teams={teams} />);
    await user.selectOptions(screen.getByTestId('field-team_ids'), ['1']);
    await user.type(screen.getByTestId(FIELD_NAME), 'New Method');
    await user.type(screen.getByTestId(FIELD_TEXT), 'Some text');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/methodology'),
      );
    });
  });
});
