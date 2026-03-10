import {
  isFieldError,
  getErrorMessage,
  handleFormError,
} from '@/shared/lib/formErrors';

describe('isFieldError', () => {
  it('returns true for object with fieldErrors', () => {
    expect(isFieldError({ fieldErrors: { email: 'Invalid' } })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isFieldError(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isFieldError('error string')).toBe(false);
  });

  it('returns false when fieldErrors is not object', () => {
    expect(isFieldError({ fieldErrors: 'string' })).toBe(false);
  });

  it('returns false when fieldErrors key is missing', () => {
    expect(isFieldError({ message: 'Error' })).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('returns Error.message for Error instances', () => {
    expect(getErrorMessage(new Error('Network timeout'))).toBe(
      'Network timeout',
    );
  });

  it('returns the string itself for string errors', () => {
    expect(getErrorMessage('Something went wrong')).toBe(
      'Something went wrong',
    );
  });

  it('returns fallback for unknown error type', () => {
    expect(getErrorMessage({ code: 42 }, 'Custom fallback')).toBe(
      'Custom fallback',
    );
  });

  it('returns default message when no fallback provided', () => {
    expect(getErrorMessage(null)).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });
});

describe('handleFormError', () => {
  it('sets field-specific errors for fieldErrors', () => {
    const setError = jest.fn();

    handleFormError(
      { fieldErrors: { email: 'Invalid email', name: 'Required' } },
      setError,
    );
    expect(setError).toHaveBeenCalledWith('email', {
      message: 'Invalid email',
    });
    expect(setError).toHaveBeenCalledWith('name', { message: 'Required' });
  });

  it('sets root error for non-field errors', () => {
    const setError = jest.fn();

    handleFormError(new Error('Server error'), setError);
    expect(setError).toHaveBeenCalledWith('root', { message: 'Server error' });
  });

  it('uses fallback message for unknown error', () => {
    const setError = jest.fn();

    handleFormError(null, setError, 'Please try again');
    expect(setError).toHaveBeenCalledWith('root', {
      message: 'Please try again',
    });
  });

  it('skips fields with falsy message', () => {
    const setError = jest.fn();

    handleFormError({ fieldErrors: { email: '', name: 'Required' } }, setError);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith('name', { message: 'Required' });
  });
});
