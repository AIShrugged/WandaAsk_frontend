import { LoginSchema, RegisterSchema } from '@/features/auth/model/schemas';

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.issues.filter(i => i.path[0] === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passErrors = result.error.issues.filter(i => i.path[0] === 'password');
      expect(passErrors.length).toBeGreaterThan(0);
    }
  });

  it('rejects password shorter than 6 chars', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'abc',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          i => i.path[0] === 'password' && i.message.includes('6'),
        ),
      ).toBe(true);
    }
  });

  it('rejects missing email', () => {
    const result = LoginSchema.safeParse({ password: 'secret123' });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  const validData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  };

  it('accepts valid registration data', () => {
    expect(RegisterSchema.safeParse(validData).success).toBe(true);
  });

  it('accepts optional invite field', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      invite: 'abc123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invite).toBe('abc123');
    }
  });

  it('parses without invite (undefined)', () => {
    const result = RegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invite).toBeUndefined();
    }
  });

  it('rejects name shorter than 2 chars', () => {
    const result = RegisterSchema.safeParse({ ...validData, name: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          i => i.path[0] === 'name' && i.message.includes('2'),
        ),
      ).toBe(true);
    }
  });

  it('rejects empty name', () => {
    const result = RegisterSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name starting with space', () => {
    const result = RegisterSchema.safeParse({ ...validData, name: ' John' });
    expect(result.success).toBe(false);
  });

  it('rejects name ending with space', () => {
    const result = RegisterSchema.safeParse({ ...validData, name: 'John ' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = RegisterSchema.safeParse({ ...validData, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});
