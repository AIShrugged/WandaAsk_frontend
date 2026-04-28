import { z } from 'zod';

export const decisionCreateSchema = z.object({
  text: z
    .string()
    .min(3, 'Decision must be at least 3 characters')
    .max(5000, 'Decision must be at most 5000 characters'),
  topic: z.string().max(255).optional().nullable(),
});

export type DecisionCreateFormData = z.infer<typeof decisionCreateSchema>;
