import Link from 'next/link';

/**
 * OrganizationCreateLink component.
 */
export default function OrganizationCreateLink() {
  const route = 'organization/create';

  return (
    <p className={'text-[20px] mt-[30px]'}>
      I want to create a{' '}
      <Link className={'cursor-pointer text-primary font-bold'} href={route}>
        new organization
      </Link>
    </p>
  );
}
