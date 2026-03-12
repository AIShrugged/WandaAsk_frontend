import {
  CreateChatSchema,
  SendMessageSchema,
  UpdateChatSchema,
} from '@/features/chat/model/schemas';

describe('CreateChatSchema', () => {
  it('accepts { title: null }', () => {
    expect(CreateChatSchema.safeParse({ title: null }).success).toBe(true);
  });

  it('accepts a short title string', () => {
    expect(CreateChatSchema.safeParse({ title: 'My chat' }).success).toBe(true);
  });

  it('rejects a title longer than 255 characters', () => {
    expect(CreateChatSchema.safeParse({ title: 'x'.repeat(256) }).success).toBe(
      false,
    );
  });
});

describe('UpdateChatSchema', () => {
  it('accepts a valid title', () => {
    expect(UpdateChatSchema.safeParse({ title: 'New name' }).success).toBe(
      true,
    );
  });

  it('rejects an empty title (min 1)', () => {
    expect(UpdateChatSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects a title longer than 255 characters (max 255)', () => {
    expect(UpdateChatSchema.safeParse({ title: 'x'.repeat(256) }).success).toBe(
      false,
    );
  });
});

describe('SendMessageSchema', () => {
  it('accepts non-empty content', () => {
    expect(SendMessageSchema.safeParse({ content: 'Hello' }).success).toBe(
      true,
    );
  });

  it('rejects empty content (min 1)', () => {
    expect(SendMessageSchema.safeParse({ content: '' }).success).toBe(false);
  });
});
