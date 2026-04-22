import { AUTH_TITLE_VARIANT, AuthTitle } from '@/features/auth';
import {
  getOrganizations,
  OrganizationCreateLink,
  OrganizationList,
  OrganizationListEmpty,
} from '@/features/organization';
import Card from '@/shared/ui/card/Card';

/**
 * Page component.
 * @returns JSX element.
 */
export default async function Page() {
  const { data: organizations } = await getOrganizations();

  if (!organizations?.length) {
    return (
      <Card>
        <div
          className={
            'w-full max-w-[690px] py-8 px-4 md:py-[100px] md:px-[72px]'
          }
        >
          <AuthTitle type={AUTH_TITLE_VARIANT.ORGANIZATION} />
          <OrganizationListEmpty />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        className={'w-full max-w-[690px] py-8 px-4 md:py-[100px] md:px-[72px]'}
      >
        <AuthTitle type={AUTH_TITLE_VARIANT.ORGANIZATION} />
        <OrganizationList organizations={organizations || []} />
        <OrganizationCreateLink />
      </div>
    </Card>
  );
}
