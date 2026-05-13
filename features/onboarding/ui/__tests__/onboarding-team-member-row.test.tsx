import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import type { EditableTeamMember } from '../../model/types';

jest.mock('@/shared/ui/input/Input', () => {
  return {
    __esModule: true,
    default: jest.fn(
      ({
        label,
        value,
        onChange,
      }: {
        label: string;
        value: string;
        onChange: React.ChangeEventHandler<HTMLInputElement>;
      }) => {
        return <input aria-label={label} value={value} onChange={onChange} />;
      },
    ),
  };
});

jest.mock('@/shared/ui/input', () => {
  return {
    InputDropdown: jest.fn(
      ({
        label,
        value,
        onChange,
        options,
      }: {
        label: string;
        value: string;
        onChange: (val: string) => void;
        options: { value: string; label: string }[];
      }) => {
        return (
          <select
            aria-label={label}
            value={value ?? ''}
            onChange={(e) => {
              onChange(e.target.value);
            }}
          >
            <option value=''>Select role</option>
            {options.map((o: { value: string; label: string }) => {
              return (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              );
            })}
          </select>
        );
      },
    ),
  };
});

jest.mock('../../model/schemas', () => {
  return {
    UserRoleSchema: {
      options: ['manager', 'employee'] as const,
      safeParse: (val: string) => {
        if (val === 'manager' || val === 'employee') {
          return { success: true, data: val };
        }
        return { success: false };
      },
    },
  };
});

jest.mock('@/shared/ui/button/Button', () => {
  return {
    Button: jest.fn(
      ({
        children,
        onClick,
        ...rest
      }: React.PropsWithChildren<{ onClick?: () => void }>) => {
        return (
          <button onClick={onClick} {...rest}>
            {children}
          </button>
        );
      },
    ),
  };
});

jest.mock('lucide-react', () => {
  return {
    Trash2: () => {
      return <span data-testid='trash-icon' />;
    },
  };
});

import { OnboardingTeamMemberRow } from '../onboarding-team-member-row';

const BASE_MEMBER: EditableTeamMember = {
  _id: 'test-id-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: null,
  found_in: [],
  already_in_system: false,
  system_user_id: null,
};

describe('OnboardingTeamMemberRow', () => {
  it('renders name and email inputs with correct values', () => {
    const onUpdate = jest.fn();
    render(
      <OnboardingTeamMemberRow
        member={BASE_MEMBER}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('Alice');
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue(
      'alice@example.com',
    );
  });

  it('renders role dropdown with current role selected', () => {
    const member = { ...BASE_MEMBER, role: 'manager' as const };
    render(
      <OnboardingTeamMemberRow
        member={member}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    const select = screen.getByRole('combobox', { name: /role/i });
    expect(select).toHaveValue('manager');
  });

  it('renders role dropdown with placeholder when role is null', () => {
    render(
      <OnboardingTeamMemberRow
        member={BASE_MEMBER}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    const select = screen.getByRole('combobox', { name: /role/i });
    expect(select).toHaveValue('');
  });

  it('calls onUpdate with manager when manager is selected', async () => {
    const onUpdate = jest.fn();
    render(
      <OnboardingTeamMemberRow
        member={BASE_MEMBER}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />,
    );

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /role/i }),
      'manager',
    );
    expect(onUpdate).toHaveBeenCalledWith({ ...BASE_MEMBER, role: 'manager' });
  });

  it('calls onUpdate with employee when employee is selected', async () => {
    const onUpdate = jest.fn();
    render(
      <OnboardingTeamMemberRow
        member={BASE_MEMBER}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />,
    );

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /role/i }),
      'employee',
    );
    expect(onUpdate).toHaveBeenCalledWith({ ...BASE_MEMBER, role: 'employee' });
  });

  it('calls onUpdate with null when role is cleared', async () => {
    const member = { ...BASE_MEMBER, role: 'manager' as const };
    const onUpdate = jest.fn();
    render(
      <OnboardingTeamMemberRow
        member={member}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />,
    );

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /role/i }),
      '',
    );
    expect(onUpdate).toHaveBeenCalledWith({ ...member, role: null });
  });

  it('calls onRemove when delete button is clicked', async () => {
    const onRemove = jest.fn();
    render(
      <OnboardingTeamMemberRow
        member={BASE_MEMBER}
        onUpdate={jest.fn()}
        onRemove={onRemove}
      />,
    );

    await userEvent.click(screen.getByTestId('trash-icon').closest('button')!);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
