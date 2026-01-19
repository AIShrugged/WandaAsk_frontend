'use client';

import { ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useActionState, useEffect } from 'react';

import { setActiveOrganization } from '@/app/actions/organization';
import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';

import type { OrganizationProps } from '@/features/organization/model/types';

export default function OrganizationDropdown({
  organizations,
  organizationActiveId,
}: {
  organizations: OrganizationProps[];
  organizationActiveId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [, action, pending] = useActionState(setActiveOrganization, {
    ok: false,
  });
  const { push } = useRouter();
  const active = organizations.find(
    o => String(o.id) === String(organizationActiveId),
  );
  const sortedOrganizations = active
    ? [active, ...organizations.filter(o => o.id !== active.id)]
    : organizations;

  useEffect(() => {
    if (!organizationActiveId && organizations.length > 0) {
      const formData = new FormData();
      formData.append('organization_id', String(organizations[0].id));
      action(formData);
    }
  }, []);

  return (
    <div className='relative w-[260px]'>
      <button
        onClick={() => setOpen(prev => !prev)}
        className='cursor-pointer  w-full flex items-center justify-between gap-2
                   rounded-full bg-green-100 px-4 py-2
                   hover:bg-green-200 transition'
      >
        <div className='text-left'>
          <div className='text-sm font-medium text-green-900'>
            {active?.name ?? 'Select organization'}
          </div>
          <div className='text-xs text-green-700'>{active?.pivot?.role}</div>
        </div>

        {open ? (
          <ChevronUp size={24} className='text-accent' />
        ) : (
          <ChevronDown size={24} className='text-accent' />
        )}
      </button>

      {open && (
        <div
          className='absolute top-full left-0 mt-2 w-full
                     rounded-2xl bg-white shadow-xl
                     z-50 overflow-hidden'
        >
          {sortedOrganizations.map(organization => (
            <form
              key={organization.id}
              action={formData => {
                action(formData);
                setOpen(false);
              }}
            >
              <input
                type='hidden'
                name='organization_id'
                value={organization.id}
              />

              <>
                {organization.id === organizationActiveId ? (
                  <div
                    className={
                      'px-4 py-2 w-full flex flex-row justify-between items-center border-b-table'
                    }
                  >
                    <div>
                      <p>{organization.name}</p>
                      <p className={'text-xs text-secondary'}>
                        {organization.pivot.role}
                      </p>
                    </div>

                    <button
                      className={'cursor-pointer'}
                      onClick={() =>
                        push(
                          `${ROUTES.DASHBOARD.ORGANIZATION}/${organization.id}`,
                        )
                      }
                    >
                      <Settings />
                    </button>
                  </div>
                ) : (
                  <button
                    type='submit'
                    disabled={pending}
                    className={
                      'px-4 py-2 cursor-pointer w-full flex items-center justify-between'
                    }
                  >
                    <p>{organization.name}</p>
                    <p className={'text-xs text-secondary'}>
                      {organization.pivot.role}
                    </p>
                  </button>
                )}
              </>
            </form>
          ))}

          <button
            onClick={() => push(`${ROUTES.DASHBOARD.ORGANIZATION}/create`)}
            type='button'
            className='w-full px-4 py-3 text-left
                       text-sm font-medium text-green-600
                       hover:bg-green-50 transition'
          >
            + {BUTTON.CREATE}
          </button>
        </div>
      )}
    </div>
  );
}
