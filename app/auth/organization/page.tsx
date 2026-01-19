import { getOrganizations } from '@/app/actions/organization';
import { AUTH_TITLE_VARIANT } from '@/features/auth/lib/options';
import AuthTitle from '@/features/auth/ui/auth-title';
import OrganizationCreateLink from '@/features/organization/ui/organization-create-link';
import OrganizationList from '@/features/organization/ui/organization-list';
import OrganizationListEmpty from '@/features/organization/ui/organization-list-empty';
import Card from '@/shared/ui/card/Card';

export default async function Page() {
  const { data: organizations } = await getOrganizations();

  return (
    <Card>
      <div className={'w-[690px] py-[100px] px-[72px]'}>
        <AuthTitle type={AUTH_TITLE_VARIANT.ORGANIZATION} />

        {organizations ? (
          <>
            <OrganizationList organizations={organizations} />
            <OrganizationCreateLink />
          </>
        ) : (
          <OrganizationListEmpty />
        )}
      </div>
    </Card>
  );
}
