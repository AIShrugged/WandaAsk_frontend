'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';


type InviteStatus = 'success' | 'invalid_token' | 'cancelled' | 'already_accepted' | 'expired';

const STATUS_CONTENT: Record<InviteStatus, { title: string; message: string }> = {
  success: {
    title: 'Invitation Accepted',
    message: 'You have successfully joined the team. You can now log in to get started.',
  },
  invalid_token: {
    title: 'Invalid Invitation',
    message: 'This invitation link is invalid. Please contact your team administrator for a new invitation.',
  },
  cancelled: {
    title: 'Invitation Cancelled',
    message: 'This invitation has been cancelled. Please contact your team administrator for assistance.',
  },
  already_accepted: {
    title: 'Already Accepted',
    message: 'This invitation has already been accepted. You can log in to access your account.',
  },
  expired: {
    title: 'Invitation Expired',
    message: 'This invitation link has expired. Please contact your team administrator for a new invitation.',
  },
};

export default function Page() {
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get('status') ?? 'success';
  const status: InviteStatus = rawStatus in STATUS_CONTENT ? (rawStatus as InviteStatus) : 'success';
  const { title, message } = STATUS_CONTENT[status];
  const isSuccess = status === 'success' || status === 'already_accepted';

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <Card>
        <CardBody>
          <div className='flex flex-col gap-4'>
            <h1 className='text-xl font-semibold'>{title}</h1>
            <p className='text-sm text-muted-foreground'>{message}</p>
            {isSuccess && (
              <div className='w-[200]'>
              <Button onClick={() => push(ROUTES.AUTH.LOGIN)}>
                Go to login page
              </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
