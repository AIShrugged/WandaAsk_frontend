'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { upsertAgendaTemplate } from '@/features/teams/api/agenda-template';
import {
  AGENDA_SECTIONS_PRE_MEETING,
  AGENDA_SECTIONS_UPCOMING,
  type AgendaSection,
  type AgendaTemplateResolved,
} from '@/features/teams/model/types';

import { AGENDA_SECTION_LABELS } from './section-labels';
import {
  SectionTemplateEditor,
  type SectionGroup,
} from './section-template-editor';

const AGENDA_GROUPS: ReadonlyArray<SectionGroup<AgendaSection>> = [
  {
    id: 'pre-meeting',
    title: 'Pre-meeting agenda',
    sections: AGENDA_SECTIONS_PRE_MEETING,
  },
  {
    id: 'upcoming',
    title: 'Post-meeting prep (upcoming agenda)',
    sections: AGENDA_SECTIONS_UPCOMING,
  },
];

interface Props {
  teamId: number;
  resolved: AgendaTemplateResolved;
  isReadOnly: boolean;
}

export function AgendaTemplateEditor({ teamId, resolved, isReadOnly }: Props) {
  const [sections, setSections] = useState<AgendaSection[]>(resolved.sections);
  const [isDefault, setIsDefault] = useState(resolved.isDefault);
  const [isSaving, startTransition] = useTransition();

  const handleSave = (next: AgendaSection[]) => {
    startTransition(async () => {
      const result = await upsertAgendaTemplate(teamId, next);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setSections(result.data.sections);
        setIsDefault(false);
        toast.success('Agenda template saved');
      }
    });
  };

  return (
    <SectionTemplateEditor<AgendaSection>
      title='Agenda template'
      description='Configure which sections appear in the meeting agenda (both pre-meeting briefing and post-meeting follow-up). Drag to reorder within each group; sections can be removed and added back.'
      badge={isDefault ? 'Using defaults' : null}
      availableSections={resolved.availableSections}
      initialSelected={sections}
      labels={AGENDA_SECTION_LABELS}
      groups={AGENDA_GROUPS}
      isReadOnly={isReadOnly}
      isSaving={isSaving}
      onSave={handleSave}
    />
  );
}
