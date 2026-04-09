import type { ParticipantEvent } from '@/entities/participant';

export interface TranscriptsProps {
  data: TranscriptProps[];
  message: string;
  meta: [];
  status: number;
  success: boolean;
}

export interface TranscriptProps {
  end_absolute: string;
  end_relative: string;
  id: number;
  participant: ParticipantEvent;
  start_absolute: string;
  start_relative: string;
  text: string;
}
