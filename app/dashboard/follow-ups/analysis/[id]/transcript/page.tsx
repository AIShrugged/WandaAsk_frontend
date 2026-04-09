import Transcript from '@/features/transcript/ui/transcript';

/**
 * Follow-up analysis — Transcript tab.
 */
export default async function FollowUpTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <Transcript id={id} />;
}
