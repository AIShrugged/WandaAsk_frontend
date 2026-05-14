import { validateBackHref } from '@/shared/lib/validate-back-href';

describe('validateBackHref', () => {
  it('returns null for undefined', () => {
    expect(validateBackHref()).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(validateBackHref('')).toBeNull();
  });

  it('accepts a valid kanban path', () => {
    const from = encodeURIComponent(
      '/dashboard/issues/kanban?organization_id=2',
    );
    expect(validateBackHref(from)).toBe(
      '/dashboard/issues/kanban?organization_id=2',
    );
  });

  it('accepts a valid list path', () => {
    const from = encodeURIComponent(
      '/dashboard/issues/list?assignee_id=3&status=open',
    );
    expect(validateBackHref(from)).toBe(
      '/dashboard/issues/list?assignee_id=3&status=open',
    );
  });

  it('accepts a valid progress path', () => {
    const from = encodeURIComponent('/dashboard/issues/progress');
    expect(validateBackHref(from)).toBe('/dashboard/issues/progress');
  });

  it('rejects a non-whitelisted path', () => {
    const from = encodeURIComponent('/dashboard/agents/profiles');
    expect(validateBackHref(from)).toBeNull();
  });

  it('rejects an external URL', () => {
    const from = encodeURIComponent('https://evil.com/steal');
    expect(validateBackHref(from)).toBeNull();
  });

  it('rejects a path traversal attempt', () => {
    const from = encodeURIComponent(
      '/dashboard/issues/kanban/../../../etc/passwd',
    );
    expect(validateBackHref(from)).toBeNull();
  });
});
