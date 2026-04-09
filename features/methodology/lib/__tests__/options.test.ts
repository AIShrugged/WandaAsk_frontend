import {
  getFormFields,
  METHODOLOGY_FIELDS,
} from '@/features/methodology/lib/options';

import type { DropdownOption } from '@/shared/ui/input/InputDropdown';

const makeOption = (id: number, label: string): DropdownOption => {
  return { value: String(id), label };
};

describe('getFormFields', () => {
  it('returns an array of 3 field definitions', () => {
    expect(getFormFields([])).toHaveLength(3);
  });

  it('first field is multiselect with name team_ids', () => {
    const [first] = getFormFields([]);

    expect(first.variant).toBe('multiselect');
    expect(first.name).toBe('team_ids');
  });

  it('passes teamOptions to the first field', () => {
    const options = [makeOption(1, 'Team A'), makeOption(2, 'Team B')];
    const [first] = getFormFields(options);

    expect(first.options).toEqual(options);
  });

  it('second field is input with name name', () => {
    const [, second] = getFormFields([]);

    expect(second.variant).toBe('input');
    expect(second.name).toBe('name');
  });

  it('second field has minLength 3 and maxLength 255 validation', () => {
    const [, second] = getFormFields([]);

    expect(second.rules?.minLength?.value).toBe(3);
    expect(second.rules?.maxLength?.value).toBe(255);
  });

  it('third field is inputTextarea with name text', () => {
    const third = getFormFields([])[2];

    expect(third.variant).toBe('inputTextarea');
    expect(third.name).toBe('text');
  });

  it('third field has rows set to 5', () => {
    const third = getFormFields([])[2];

    expect(third.rows).toBe(5);
  });

  it('all fields have required rules', () => {
    const fields = getFormFields([]);

    for (const field of fields) {
      expect(field.rules?.required).toBeTruthy();
    }
  });

  it('first field is searchable', () => {
    const [first] = getFormFields([]);

    expect(first.searchable).toBe(true);
  });

  it('returns new array each call (referential independence)', () => {
    const result1 = getFormFields([]);
    const result2 = getFormFields([]);

    expect(result1).not.toBe(result2);
  });
});

describe('METHODOLOGY_FIELDS', () => {
  it('has empty string defaults', () => {
    expect(METHODOLOGY_FIELDS.organization_id).toBe('');
    expect(METHODOLOGY_FIELDS.name).toBe('');
    expect(METHODOLOGY_FIELDS.text).toBe('');
  });

  it('has empty team_ids array', () => {
    expect(METHODOLOGY_FIELDS.team_ids).toEqual([]);
  });
});
