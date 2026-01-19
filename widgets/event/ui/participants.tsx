import React from 'react';

import { ParticipantList } from '@/features/participants/ui/participant-list';
import ParticipantsTitle from '@/features/participants/ui/participants-title';

import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';

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
