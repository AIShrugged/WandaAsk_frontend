'use client';

import { TEAM_CREATE_VALUES } from '@/features/teams/model/fields';
import ModalBody from '@/shared/ui/modal/modal-body';
import ModalHeader from '@/shared/ui/modal/modal-header';
import { ModalRoot } from '@/shared/ui/modal/modal-root';

import TeamCreateForm from './team-create-form';

import type { TeamProps } from '@/entities/team';

interface TeamCreateModalProps {
  close: () => void;
  organizationId: string;
  onTeamCreated?: (teamId: number) => void;
}

/**
 * TeamCreateModal — modal wrapper for the team creation form.
 */
export default function TeamCreateModal({
  close,
  organizationId,
  onTeamCreated,
}: TeamCreateModalProps) {
  const handleSuccess = (teamId: number) => {
    close();
    onTeamCreated?.(teamId);
  };

  return (
    <ModalRoot open onClose={close}>
      <ModalHeader onClick={close} title='Create team' />
      <ModalBody>
        <TeamCreateForm
          organization_id={organizationId}
          values={TEAM_CREATE_VALUES as TeamProps}
          onSuccess={handleSuccess}
        />
      </ModalBody>
    </ModalRoot>
  );
}
