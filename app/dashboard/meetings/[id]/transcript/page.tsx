import Transcript from '@/features/transcript/ui/transcript';

/**
 * Meeting transcript tab — shows timestamped speech segments with infinite scroll.
 */
export default async function MeetingTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <Transcript id={id} />;
}
