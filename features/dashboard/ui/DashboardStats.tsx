import { MessageSquare, BookOpen, Users } from 'lucide-react';

interface DashboardStatsProps {
  teamsCount: number;
  chatsCount: number;
  methodologiesCount: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-card'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-muted-foreground'>{label}</span>
        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary'>
          {icon}
        </div>
      </div>
      <p className='text-3xl font-bold text-foreground tabular-nums'>{value}</p>
    </div>
  );
}

export function DashboardStats({
  teamsCount,
  chatsCount,
  methodologiesCount,
}: DashboardStatsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
      <StatCard
        label='Teams'
        value={teamsCount}
        icon={<Users className='h-4 w-4' />}
      />
      <StatCard
        label='Chats'
        value={chatsCount}
        icon={<MessageSquare className='h-4 w-4' />}
      />
      <StatCard
        label='Methodologies'
        value={methodologiesCount}
        icon={<BookOpen className='h-4 w-4' />}
      />
    </div>
  );
}
