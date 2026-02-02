import FollowUp from '@/features/follow-up/ui/follow-up';
import React from 'react';
import { getFollowUp } from '@/app/actions/follow-up';

export default async function FollowUpData({ id }: { id: number }) {
  const { data: followUp } = await getFollowUp(+id);

  return <FollowUp data={followUp?.text} />;
}
