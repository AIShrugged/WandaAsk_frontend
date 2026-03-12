import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

type FieldErrors<T> = {
  fieldErrors: Partial<Record<keyof T, string>>;
};

/**
 * Type guard to check if error has fieldErrors property
 * @param error
 */
export const isFieldError = <T>(error: unknown): error is FieldErrors<T> => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'fieldErrors' in error &&
    typeof (error as FieldErrors<T>).fieldErrors === 'object'
  );
};

/**
 * Extracts error message from unknown error type
 * @param error
 * @param fallback
 */
export const getErrorMessage = (error: unknown, fallback?: string): string => {
  if (error instanceof Error) return error.message;

  if (typeof error === 'string') return error;

  return fallback || 'An unexpected error occurred. Please try again.';
};

/**
 * Handles form errors from server actions
 * Sets field-specific errors or root error based on error type
 * @param error
 * @param setError
 * @param fallbackMessage
 */
export const handleFormError = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallbackMessage?: string,
): void => {
  if (isFieldError<T>(error)) {
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (message) {
        setError(field as Path<T>, { message: message as string });
      }
    }

    return;
  }

  setError('root' as Path<T>, {
    message: getErrorMessage(error, fallbackMessage),
  });
};
