export interface ParticipantEvent {
  calendar_event_id: number;
  id: number;
  name: string;
  profile?: null;
}

export interface AttendeeProps {
  variant: 'attendee';
  calendar_event_id: number;
  id: number;
  name: string;
  profile: null | GuestCore;
}

export interface GuestProps extends GuestCore {
  variant: 'guest';
}

export interface GuestCore {
  id: number;
  email: string;
}
