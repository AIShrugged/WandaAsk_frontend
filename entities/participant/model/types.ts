export interface ParticipantEvent {
  calendar_event_id: number;
  id: number;
  name: string;
  profile?: null | ProfileCore;
}

export interface AttendeeProps {
  variant: 'attendee';
  calendar_event_id: number;
  id: number;
  name: string;
  profile: null | ProfileCore;
}

export interface GuestProps extends ProfileCore {
  variant: 'guest';
}

/** Matches backend ProfileResource: { id, channel, channel_identifier, user_id } */
export interface ProfileCore {
  id: number;
  channel: string;
  channel_identifier: string;
  user_id: number;
}

/** @deprecated Use ProfileCore */
export interface GuestCore {
  id: number;
  channel_identifier: string;
}
