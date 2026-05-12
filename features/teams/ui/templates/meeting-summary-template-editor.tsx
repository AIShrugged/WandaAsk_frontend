'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { upsertMeetingSummaryTemplate } from '@/features/teams/api/meeting-summary-template';
import {
  MEETING_SUMMARY_DEFAULT_SECTIONS,
  type MeetingSummarySection,
  type MeetingSummaryTemplateResolved,
} from '@/features/teams/model/types';

import { SUMMARY_SECTION_LABELS } from './section-labels';
import { SectionTemplateEditor } from './section-template-editor';

interface Props {
  teamId: number;
  resolved: MeetingSummaryTemplateResolved;
  isReadOnly: boolean;
}

export function MeetingSummaryTemplateEditor({
  teamId,
  resolved,
  isReadOnly,
}: Props) {
  const [sections, setSections] = useState<MeetingSummarySection[]>(
    resolved.sections,
  );
  const [isDefault, setIsDefault] = useState(resolved.isDefault);
  const [isSaving, startTransition] = useTransition();

  const handleSave = (next: MeetingSummarySection[]) => {
    startTransition(async () => {
      const result = await upsertMeetingSummaryTemplate(teamId, next);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setSections(result.data.sections);
        setIsDefault(false);
        toast.success('Meeting summary template saved');
      }
    });
  };

  return (
    <SectionTemplateEditor<MeetingSummarySection>
      title='Meeting summary template'
      description='Choose which sections appear in the Telegram meeting summary, and in what order. The summary is rendered for each completed meeting.'
      badge={isDefault ? 'Using defaults' : null}
      availableSections={MEETING_SUMMARY_DEFAULT_SECTIONS}
      initialSelected={sections}
      labels={SUMMARY_SECTION_LABELS}
      isReadOnly={isReadOnly}
      isSaving={isSaving}
      onSave={handleSave}
    />
  );
}
