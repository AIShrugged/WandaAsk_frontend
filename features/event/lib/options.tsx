import { parse as dateParse, format } from 'date-fns';
import parse from 'html-react-parser';
import { Clock4, Dot, TextAlignJustify, Video } from 'lucide-react';

import ButtonCopy from '@/shared/ui/button/button-copy';

import type { EventProps } from '@/entities/event';

/**
 * formatDate.
 * @param dateString - dateString.
 * @returns Result.
 */
function formatDate(dateString: string) {
  const date = new Date(dateString.replace(' ', 'T'));

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * formatTime.
 * @param dateString - dateString.
 * @param withMeridiem - withMeridiem.
 * @returns Result.
 */
function formatTime(dateString: string, withMeridiem: boolean): string {
  const date = dateParse(dateString, 'yyyy-MM-dd HH:mm:ss', new Date());

  return format(date, withMeridiem ? 'h:mmb' : 'h:mm');
}

/**
 * parseHTML.
 * @param htmlString - htmlString.
 * @returns Result.
 */
function parseHTML(htmlString: string) {
  return htmlString ? parse(htmlString) : 'This event has no description';
}

export const items = [
  {
    Icon: Clock4,
    label: 'data',
    /**
     * value.
     * @param d - d.
     * @returns Result.
     */
    value: (d: EventProps) => {
      return (
        <div className={'flex flex-row items-center'}>
          {formatDate(d.starts_at)} <Dot /> {formatTime(d.starts_at, false)} –{' '}
          {formatTime(d.ends_at, true)}
        </div>
      );
    },
  },
  {
    Icon: Video,
    label: 'url',
    /**
     * value.
     * @param d - d.
     * @returns Result.
     */
    value: (d: EventProps) => {
      return (
        <div className={'flex flex-row gap-2.5 items-center min-w-0'}>
          <span className='truncate'>{d.url}</span>
          <ButtonCopy copyText={d.url} />
        </div>
      );
    },
  },
  {
    Icon: TextAlignJustify,
    label: 'description',
    /**
     * value.
     * @param d - d.
     * @returns Result.
     */
    value: (d: EventProps) => {
      return parseHTML(d.description);
    },
  },
] as const;
