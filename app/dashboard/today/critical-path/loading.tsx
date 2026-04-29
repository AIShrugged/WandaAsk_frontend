import Card from '@/shared/ui/card/Card';

export default function CriticalPathLoading() {
  return (
    <Card className='h-full flex flex-col'>
      <div className='flex-1 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin' />
          <p className='text-sm text-muted-foreground'>Loading critical path…</p>
        </div>
      </div>
    </Card>
  );
}
