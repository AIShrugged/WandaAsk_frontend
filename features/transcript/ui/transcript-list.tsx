import { formatChatTime } from '@/features/transcript/lib/chatTime';

import type { TranscriptProps } from '@/features/transcript/model/types';

/**
 * TranscriptList component.
 * @param props - Component props.
 * @param props.data
 */
export default function TranscriptList({ data }: { data: TranscriptProps[] }) {
  if (!data) return;

  return (
    <div className='flex flex-col gap-4'>
      {data.map((item) => {
        return (
          <div key={item.id}>
            <div className='flex flex-row gap-2 items-center'>
              <p className='text-sm font-normal leading-normal text-muted-foreground'>
                {formatChatTime(Number(item.start_relative))}
              </p>
              <p className='text-sm font-normal leading-normal text-primary'>
                {item.participant.name}
              </p>
            </div>

            <div>
              <p className='text-base font-normal leading-normal text-foreground'>
                {item.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
