export type MeetingScope = 'all' | 'upcoming' | 'past';

export interface MeetingsListFilters {
  scope: MeetingScope;
  team_id: number | null;
  offset?: number;
  limit?: number;
}

export const DEFAULT_MEETINGS_FILTERS: MeetingsListFilters = {
  scope: 'all',
  team_id: null,
};

type SearchParamsLike = {
  get(key: string): string | null;
};

export function parseFilters(sp: SearchParamsLike): MeetingsListFilters {
  const rawScope = sp.get('scope');
  const rawTeamId = sp.get('team_id');

  const scope: MeetingScope =
    rawScope === 'past' || rawScope === 'upcoming' ? rawScope : 'all';

  const teamId = rawTeamId ? Number(rawTeamId) : null;

  return {
    scope,
    team_id: Number.isFinite(teamId) ? teamId : null,
  };
}

export function serializeFilters(f: MeetingsListFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.scope !== 'all') sp.set('scope', f.scope);
  if (f.team_id != null) sp.set('team_id', String(f.team_id));
  return sp;
}

export function hasActiveFilters(f: MeetingsListFilters): boolean {
  return f.scope !== 'all' || f.team_id != null;
}
