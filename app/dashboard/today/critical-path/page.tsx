import { CriticalPathPageClient } from '@/features/issues/ui/critical-path-page';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Critical Path' };

export default async function CriticalPathPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const orgId = params.organization_id ? Number(params.organization_id) : undefined;
  const teamId = params.team_id ? Number(params.team_id) : undefined;

  return <CriticalPathPageClient organizationId={orgId} teamId={teamId} />;
}
