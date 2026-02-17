import TeamMember from '@/features/teams/ui/team-member';

import type { TeamProps } from '@/entities/team';

export default function TeamMembers({ data }: { data: TeamProps }) {
  return (
    <div
      className={
        'grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pt-[24px] pb-[38px] pl-[24px] pr-[24px]'
      }
    >
      {/*  {data.map(member => (
        <TeamMember key={member.id} member={member} />
      ))}*/}
    </div>
  );
}
