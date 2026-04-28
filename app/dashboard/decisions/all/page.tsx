import { loadDecisionsTeams } from '@/features/decisions/api/load-teams';
import { DecisionsPage } from '@/features/decisions/ui/decisions-page';

export default async function DecisionsAllPage() {
  const teams = await loadDecisionsTeams();

  return <DecisionsPage teams={teams} sourceTypeFilter={null} />;
}
