import {
  getOrganizations,
  OrganizationCreateLink,
  OrganizationList,
  OrganizationListEmpty,
} from '@/features/organization';
import { Card } from '@/shared/ui/card';

export default async function Page() {
  const { data: organizations } = await getOrganizations();

  if (!organizations?.length) {
    return (
      <div className='w-full max-w-[480px]'>
        <Card>
          <div className='px-8 py-10'>
            <div className='mb-8'>
              <h1 className='text-xl font-semibold tracking-tight'>
                Select Organization
              </h1>
              <p className='text-sm text-muted-foreground mt-1'>
                You don't have any organizations yet
              </p>
            </div>
            <OrganizationListEmpty />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='w-full max-w-[480px]'>
      <Card>
        <div className='px-8 py-10'>
          <div className='mb-8'>
            <h1 className='text-xl font-semibold tracking-tight'>
              Select Organization
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Choose an organization to continue
            </p>
          </div>
          <OrganizationList organizations={organizations} />
          <OrganizationCreateLink />
        </div>
      </Card>
    </div>
  );
}
