'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { createChat } from '@/features/chat/api/chats';
import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

const AUTO_PROMPT = 'Помоги создать методологию оценки сотрудников';

/**
 * MethodologyCreate component.
 * @returns JSX element.
 */
export default function MethodologyCreate() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  /**
   * handleCreate — creates a new chat and navigates to it with an auto-prompt.
   */
  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const result = await createChat({ title: 'Методология оценки' });

      if ('error' in result) {
        toast.error(result.error);

        return;
      }

      router.push(
        `${ROUTES.DASHBOARD.CHAT}/${result.id}?prompt=${encodeURIComponent(AUTO_PROMPT)}`,
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={'mt-auto mx-4 md:ml-6 md:mr-8 mb-6 w-auto md:w-[240px]'}>
      <Button
        type='button'
        onClick={handleCreate}
        disabled={isCreating}
        className='cursor-pointer'
      >
        <Plus /> {BUTTON.ADD} methodology
      </Button>
    </div>
  );
}
