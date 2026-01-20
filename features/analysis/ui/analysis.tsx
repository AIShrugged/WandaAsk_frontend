import { getFollowUps } from '@/app/actions/calendar-events';
import { getfollowUp } from '@/app/actions/follow-up';
import Conclusion from '@/features/analysis/widgets/conclusion';
import Linear from '@/features/analysis/widgets/linear';
import Summary from '@/features/analysis/widgets/summary';
import Total from '@/features/analysis/widgets/total';

import type { AnalysisProps } from '@/features/analysis/model/types';
import type {
  FollowUpResponse,
  FollowUpsResponse,
} from '@/features/follow-up/model/types';

export default async function Analysis({ id }: { id: number }) {
  const followUps: FollowUpsResponse = await getFollowUps(id);

  if (!followUps?.data || followUps.data.length === 0) {
    return <div>No analysis</div>;
  }

  const latestId = Math.max(...followUps.data.map(item => item.id));
  const followUp: FollowUpResponse = await getfollowUp(latestId);

  let parsed: AnalysisProps;
  try {
    parsed = JSON.parse(followUp.data.text) as AnalysisProps;
  } catch {
    return <div>Error in JSON</div>;
  }

  if (!parsed) return;

  console.log('parsed', parsed);

  return (
    <div className={'flex flex-col gap-10'}>
      {parsed.total && <Total total={parsed.total} />}
      <Summary metrics={parsed.metrics} />
      {parsed.metrics.map((item, index) => (
        <Linear key={index} {...item} />
      ))}
      {parsed.conclusion && <Conclusion conclusion={parsed.conclusion} />}
    </div>
  );
}
