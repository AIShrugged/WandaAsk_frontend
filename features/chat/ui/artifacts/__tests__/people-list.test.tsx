import { render, screen } from '@testing-library/react';

import { PeopleList } from '@/features/chat/ui/artifacts/people-list';

/**
 *
 * @param overrides
 */
const makeMember = (overrides = {}) => {
  return {
    name: 'Alice Johnson',
    role: 'Developer',
    user_id: 1,
    ...overrides,
  };
};

describe('PeopleList', () => {
  it('renders "No members" when members array is empty', () => {
    render(<PeopleList data={{ members: [] }} />);
    expect(screen.getByText('No members')).toBeInTheDocument();
  });

  it('renders member name', () => {
    render(<PeopleList data={{ members: [makeMember()] }} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('renders member role', () => {
    render(<PeopleList data={{ members: [makeMember()] }} />);
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('renders initials in the avatar', () => {
    render(
      <PeopleList
        data={{ members: [makeMember({ name: 'Alice Johnson' })] }}
      />,
    );
    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('renders single initial for one-word name', () => {
    render(<PeopleList data={{ members: [makeMember({ name: 'Alice' })] }} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders multiple members', () => {
    render(
      <PeopleList
        data={{
          members: [
            makeMember({ name: 'Alice', user_id: 1 }),
            makeMember({ name: 'Bob', user_id: 2, role: 'Designer' }),
          ],
        }}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
  });
});
