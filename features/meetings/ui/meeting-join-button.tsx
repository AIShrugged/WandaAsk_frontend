'use client';

import { Video } from 'lucide-react';

interface MeetingJoinButtonProps {
  url: string | null | undefined;
  isCompleted: boolean;
}

/**
 * MeetingJoinButton — renders a "Connect" link to join an upcoming meeting.
 * Hidden when the meeting has no URL or is already completed.
 */
export function MeetingJoinButton({
  url,
  isCompleted,
}: MeetingJoinButtonProps) {
  if (!url || isCompleted) return null;

  return (
    <a
      href={url}
      target='_blank'
      rel='noreferrer'
      onClick={(e) => {
        e.stopPropagation();
      }}
      className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20'
    >
      <Video className='h-3 w-3' />
      Connect
    </a>
  );
}
