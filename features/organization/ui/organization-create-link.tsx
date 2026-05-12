import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

export default function OrganizationCreateLink() {
  return (
    <p className='text-sm text-muted-foreground mt-6'>
      I want to create a{' '}
      <Link
        className='text-primary font-medium hover:underline underline-offset-4'
        href={`${ROUTES.AUTH.ORGANIZATION}/create`}
      >
        new organization
      </Link>
    </p>
  );
}
