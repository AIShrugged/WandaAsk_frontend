import { format, isToday } from 'date-fns';

export default function Day({ currentDay }: { currentDay: Date }) {
  return (
    <div className='flex justify-center'>
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium
                  ${isToday(currentDay) ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
      >
        {format(currentDay, 'd')}
      </div>
    </div>
  );
}
