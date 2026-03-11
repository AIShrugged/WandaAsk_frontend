/* eslint-disable jsdoc/require-jsdoc, max-statements */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('lucide-react', () => {
  return {
    ChevronDown: () => {
      return <span data-testid='chevron' />;
    },
    Check: () => {
      return <span data-testid='check' />;
    },
  };
});

import InputDropdown from '@/shared/ui/input/InputDropdown';

import type { DropdownOption } from '@/shared/ui/input/InputDropdown';

const options: DropdownOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

const user = userEvent.setup({ delay: null });

describe('InputDropdown', () => {
  it('renders the trigger with placeholder', () => {
    render(<InputDropdown options={options} placeholder='Choose one' />);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
  });

  it('renders selected label when value is set', () => {
    render(<InputDropdown options={options} value='b' onChange={jest.fn()} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('opens the listbox on trigger click', async () => {
    render(<InputDropdown options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('closes listbox after selecting an option (single mode)', async () => {
    render(<InputDropdown options={options} onChange={jest.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('calls onChange with selected value', async () => {
    const onChange = jest.fn();

    render(<InputDropdown options={options} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders a label when provided', () => {
    render(<InputDropdown options={options} label='Category' />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    render(<InputDropdown options={options} disabled />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows search input when searchable (default)', async () => {
    render(<InputDropdown options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('hides search input when searchable=false', async () => {
    render(<InputDropdown options={options} searchable={false} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
  });

  it('filters options by search query', async () => {
    render(<InputDropdown options={options} />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search'), 'al');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('shows "Nothing found" when search has no results', async () => {
    render(<InputDropdown options={options} />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search'), 'zzz');
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });

  it('toggles option in multiple mode', async () => {
    const onChange = jest.fn();

    render(
      <InputDropdown
        options={options}
        multiple
        value={[]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('removes option in multiple mode when already selected', async () => {
    const onChange = jest.fn();

    render(
      <InputDropdown
        options={options}
        multiple
        value={['a']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows check icon next to selected option', async () => {
    render(<InputDropdown options={options} value='a' onChange={jest.fn()} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByTestId('check')).toBeInTheDocument();
  });

  it('closes on Escape key press', async () => {
    render(<InputDropdown options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates options with ArrowDown/ArrowUp', async () => {
    render(
      <InputDropdown
        options={options}
        searchable={false}
        onChange={jest.fn()}
      />,
    );
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders string error message below the trigger', () => {
    render(<InputDropdown options={options} error='Required' />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('marks combobox as aria-invalid when error is set', () => {
    render(<InputDropdown options={options} error='Required' />);
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('shows multiple display label: "A +1" for two selections', () => {
    render(
      <InputDropdown
        options={options}
        multiple
        value={['a', 'b']}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Alpha +1')).toBeInTheDocument();
  });

  it('does not call onChange for disabled option', async () => {
    const onChange = jest.fn();

    const opts: DropdownOption[] = [
      { value: 'x', label: 'Disabled opt', disabled: true },
    ];

    render(<InputDropdown options={opts} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await act(async () => {
      await user.click(screen.getByRole('option', { name: 'Disabled opt' }));
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes on outside click', async () => {
    render(
      <div>
        <InputDropdown options={options} />
        <button>Outside</button>
      </div>,
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
