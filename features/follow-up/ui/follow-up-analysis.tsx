import { LayoutDashboard } from 'lucide-react';

import { ArtifactCard } from '@/entities/artifact';
import { getArtifacts } from '@/entities/artifact/api/artifacts';

interface Props {
  /** ID of the chat whose artifacts should be rendered. Null when no chat is linked. */
  chatId: number | null;
}

/**
 * Renders follow-up analysis using the artifacts configured in the methodology chat.
 *
 * The parent page is responsible for resolving the methodology's chat ID
 * (via getMethodologyChat) and passing it here as a prop.
 * This keeps FSD boundaries clean: features/follow-up only imports from entities/.
 * @param props - Component props.
 * @param props.chatId - ID of the methodology configuration chat.
 * @returns JSX element.
 */
export default async function FollowUpAnalysis({ chatId }: Props) {
  if (!chatId) {
    return (
      <AnalysisEmptyState message='This methodology has not been configured via chat yet. Open the AI chat and describe your evaluation criteria to get started.' />
    );
  }

  const artifactsResponse = await getArtifacts(chatId);

  if (!artifactsResponse || artifactsResponse.layout.items.length === 0) {
    return (
      <AnalysisEmptyState message='No visual artifacts found for this methodology. Ask the AI to create evaluation charts or criteria cards in the methodology chat.' />
    );
  }

  const { artifacts, layout } = artifactsResponse;

  return (
    <div className='flex flex-col gap-6'>
      {layout.items.map(({ id }) => {
        const artifact = artifacts[id];

        if (!artifact) return null;

        return <ArtifactCard key={id} artifact={artifact} />;
      })}
    </div>
  );
}

/**
 * AnalysisEmptyState component.
 * @param props - Component props.
 * @param props.message - Message to display.
 * @returns JSX element.
 */
function AnalysisEmptyState({ message }: { message: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-16 gap-4 text-center'>
      <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
        <LayoutDashboard className='w-6 h-6 text-primary' />
      </div>
      <div className='max-w-sm'>
        <p className='text-sm font-medium text-foreground'>
          No analysis configured
        </p>
        <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
          {message}
        </p>
      </div>
    </div>
  );
}
