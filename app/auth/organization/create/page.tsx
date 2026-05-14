import { OrganizationForm } from '@/features/organization';
import { Card } from '@/shared/ui/card';
import { H1 } from '@/shared/ui/typography/H1';

export default function Page() {
  return (
    <Card>
      <div className='w-full max-w-[690px] py-8 px-4 md:py-[100px] md:px-[72px]'>
        <div className='flex justify-center mb-8 md:mb-[70px]'>
          <H1>Organization</H1>
        </div>
        <OrganizationForm />
      </div>
    </Card>
  );
}
