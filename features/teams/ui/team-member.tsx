import { ArrowLeftRight, Trash } from 'lucide-react';

import type { TeamProps } from '@/entities/team';

export default function TeamMember({ member }: { member: TeamProps }) {
  return (
    <div className={'w-full bg-secondary rounded-[16px] gap-5 px-4 py-5'}>
      <div className={'flex flex-row justify-between'}>
        <p> {member?.name}</p>

        <div className={'flex flex-row gap-2'}>
          <Trash size={'18'} />
          <ArrowLeftRight size={'18'} />
        </div>
      </div>

      <div>member.role</div>
    </div>
  );
}
