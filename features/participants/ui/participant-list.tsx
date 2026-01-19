import React from 'react';

import Avatar from '@/shared/ui/common/avatar';

import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';

export const ParticipantList = ({
  data = [],
}: {
  data: AttendeeProps[] | GuestProps[];
}) => {
  return (
    <div className='flex flex-col gap-4'>
      {data.map(item => (
        <div key={item.id} className={'flex flex-row gap-4'}>
          <Avatar>
            {'name' in item && item.name
              ? item.name[0]
              : (item as GuestProps).email[0]}
          </Avatar>

          <div className='flex items-center gap-4'>
            {'name' in item && item.name
              ? item.name
              : (item as GuestProps).email}
          </div>
        </div>
      ))}
    </div>
  );
};
