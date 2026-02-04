import { getOrganizations } from '@/features/organization/api/organization';
import { AUTH_TITLE_VARIANT } from '@/features/auth/lib/options';
import AuthTitle from '@/features/auth/ui/auth-title';
import OrganizationCreateLink from '@/features/organization/ui/organization-create-link';
import OrganizationList from '@/features/organization/ui/organization-list';
import OrganizationListEmpty from '@/features/organization/ui/organization-list-empty';
import Card from '@/shared/ui/card/Card';

export default async function Page() {
  const { data: organizations } = await getOrganizations();

  if (!organizations?.length) {
    return (
      <Card>
        <div className={'w-[690px] py-[100px] px-[72px]'}>
          <AuthTitle type={AUTH_TITLE_VARIANT.ORGANIZATION} />
          <OrganizationListEmpty />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className={'w-[690px] py-[100px] px-[72px]'}>
        <AuthTitle type={AUTH_TITLE_VARIANT.ORGANIZATION} />
        <OrganizationList organizations={organizations} />
        <OrganizationCreateLink />
      </div>
    </Card>
  );
}
