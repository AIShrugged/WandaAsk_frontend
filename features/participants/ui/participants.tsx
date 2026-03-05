import React from 'react';

import { ParticipantList } from '@/features/participants/ui/participant-list';
import ParticipantsTitle from '@/features/participants/ui/participants-title';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

/**
 * Participants component.
 * @param root0
 * @param root0.list
 * @param root0.title
 */
export default function Participants({
  list,
  title,
}: {
  list: GuestProps[] | AttendeeProps[];
  title: string;
}) {
  return (
    <div>
      <ParticipantsTitle>{title}</ParticipantsTitle>
      <ParticipantList data={list} />
    </div>
  );
}
