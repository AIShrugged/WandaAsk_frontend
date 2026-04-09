import { emailField } from '@/shared/lib/fields';

describe('emailField', () => {
  it('has correct name', () => {
    expect(emailField.name).toBe('email');
  });

  it('is required', () => {
    expect(emailField.rules.required).toBe('Email is required');
  });

  it('validates correct email', () => {
    expect(emailField.rules.pattern.value.test('user@example.com')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(emailField.rules.pattern.value.test('notanemail')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(emailField.rules.pattern.value.test('user@')).toBe(false);
  });

  it('rejects email without TLD', () => {
    expect(emailField.rules.pattern.value.test('user@domain')).toBe(false);
  });

  it('has type email', () => {
    expect(emailField.type).toBe('email');
  });
});
