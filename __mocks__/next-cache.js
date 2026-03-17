// Mock for next/cache — server-only module not available in jsdom
export const revalidatePath = jest.fn();
export const revalidateTag = jest.fn();
export const unstable_noStore = jest.fn();

/**
 * @param {Function} fn
 * @returns {Function}
 */
export const unstable_cache = (fn) => {
  return fn;
};

/**
 * @param {Function} fn
 * @returns {Function}
 */
export const cache = (fn) => {
  return fn;
};
