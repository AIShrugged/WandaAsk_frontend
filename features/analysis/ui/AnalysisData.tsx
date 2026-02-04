import { getFollowUp } from '@/features/follow-up/api/follow-up';
import Analysis from '@/features/analysis/ui/analysis';

export default async function AnalysisData({ id }: { id: number }) {
  const { data: followUp } = await getFollowUp(+id);

  return <Analysis data={followUp.text} />;
}
