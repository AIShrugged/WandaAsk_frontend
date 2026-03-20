/**
 *
 * @param value
 */
export function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) return '';

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

/**
 *
 * @param value
 */
export function parseJsonInput(
  value: string,
): Record<string, unknown> | null | never {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const parsed = JSON.parse(trimmed) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object');
  }

  return parsed as Record<string, unknown>;
}
