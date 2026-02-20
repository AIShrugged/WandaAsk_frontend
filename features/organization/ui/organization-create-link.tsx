import Link from 'next/link';

export default function OrganizationCreateLink() {
  const route = 'organization/create';

  return (
    <p className={'text-[20px] mt-[30px]'}>
      I want to create a{' '}
      <Link className={'text-primary font-bold'} href={route}>
        new organization
      </Link>
    </p>
  );
}
