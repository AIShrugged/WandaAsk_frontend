import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * GET /api/auth/clear-session
 *
 * Clears auth cookies and redirects to the login page.
 * Used when the server detects a 401 (expired/invalid token) inside a
 * Server Component, where direct cookie mutation is not allowed.
 */
export async function GET() {
  const store = await cookies();
  store.delete('token');
  store.delete('organization_id');

  redirect('/auth/login');
}
