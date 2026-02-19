import type { TeamProps } from '@/entities/team';

export default function TeamMembers(_props: { data: TeamProps }) {
  return (
    <div
      className={
        'grid gap-4 grid-cols-1 phone:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pt-[24px] pb-[38px] pl-[24px] pr-[24px]'
      }
    >
    </div>
  );
}
