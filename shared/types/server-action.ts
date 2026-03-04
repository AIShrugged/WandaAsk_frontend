export type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string };
