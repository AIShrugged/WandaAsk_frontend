import { z } from 'zod';

export const CreateChatSchema = z.object({
  title: z.string().max(255).nullable().optional(),
});

export const UpdateChatSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

export type CreateChatDTO = z.infer<typeof CreateChatSchema>;
export type UpdateChatDTO = z.infer<typeof UpdateChatSchema>;
export type SendMessageDTO = z.infer<typeof SendMessageSchema>;
