import { getSources } from '@/features/calendar/api/source';
import { getUser } from '@/features/user';
import {
  CalendarSection,
  ChangePasswordForm,
  ProfileForm,
} from '@/features/user-profile';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * ProfilePage component.
 * @returns JSX element.
 */
export default async function ProfilePage() {
  const { data: user } = await getUser();
  const sources = await getSources();
  const calendarSource =
    sources.find((s) => {
      return s.is_connected === '1' || s.is_connected === true;
    }) ?? null;

  return (
    <Card className='h-full flex flex-col overflow-y-auto'>
      <PageHeader title='Profile' hasButtonBack />

      <div className='flex flex-col gap-8 p-6 max-w-xl'>
        {user ? (
          <>
            {/* Account info */}
            <section className='flex flex-col gap-4'>
              <h2 className='text-base font-semibold text-foreground border-b border-border pb-2'>
                Account info
              </h2>
              <ProfileForm user={user} />
            </section>

            {/* Change password */}
            <section className='flex flex-col gap-4'>
              <h2 className='text-base font-semibold text-foreground border-b border-border pb-2'>
                Change password
              </h2>
              <ChangePasswordForm />
            </section>

            {/* Calendar */}
            <section className='flex flex-col gap-4'>
              <h2 className='text-base font-semibold text-foreground border-b border-border pb-2'>
                Calendar
              </h2>
              <CalendarSection source={calendarSource} />
            </section>
          </>
        ) : (
          <p className='text-sm text-muted-foreground'>
            Unable to load profile. Please try again later.
          </p>
        )}
      </div>
    </Card>
  );
}
