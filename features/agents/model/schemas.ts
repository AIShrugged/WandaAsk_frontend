import { z } from 'zod';

export const jsonStringSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;

    try {
      JSON.parse(value);

      return true;
    } catch {
      return false;
    }
  }, 'Enter valid JSON');
