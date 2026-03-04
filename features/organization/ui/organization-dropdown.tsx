'use client';

import { ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useActionState, useEffect } from 'react';
import { toast } from 'sonner';

import { setActiveOrganization } from '@/features/organization/api/organization';
import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';

import type { OrganizationProps } from '@/entities/organization';

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
    <div className='relative w-full max-w-[260px]'>
      <button
        onClick={() => setOpen(prev => !prev)}
        className='cursor-pointer w-full flex items-center justify-between gap-2
                   rounded-[var(--radius-button)] bg-accent px-4 py-2
                   hover:bg-accent/80 transition'
      >
        <div className='text-left'>
          <div className='text-sm font-medium text-accent-foreground'>
            {active?.name ?? 'Select organization'}
          </div>
          <div className='text-xs text-accent-foreground/70'>
            {active?.pivot?.role}
          </div>
        </div>

        {open ? (
          <ChevronUp size={18} className='text-primary' />
        ) : (
          <ChevronDown size={18} className='text-primary' />
        )}
      </button>

      {open && (
        <div
          className='absolute top-full left-0 mt-2 min-w-full w-max max-w-xs
                     rounded-[var(--radius-card)] bg-popover border border-border shadow-card
                     z-50 overflow-hidden'
        >
          {sortedOrganizations.map(organization => (
            <form
              key={organization.id}
              action={formData => {
                action(formData);
                setOpen(false);
                toast.success(`Switched to: ${organization.name}`);
              }}
            >
              <input
                type='hidden'
                name='organization_id'
                value={organization.id}
              />

              <>
                {organization.id === organizationActiveId ? (
                  <div className='gap-5 px-4 py-2.5 w-full flex flex-row justify-between items-center border-b border-border bg-accent/30'>
                    <div>
                      <p className='text-sm font-medium text-foreground'>
                        {organization.name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {organization.pivot.role}
                      </p>
                    </div>

                    <button
                      className='cursor-pointer text-muted-foreground hover:text-foreground transition-colors'
                      onClick={() => {
                        setOpen(false);
                        push(
                          `${ROUTES.DASHBOARD.ORGANIZATION}/${organization.id}`,
                        );
                      }}
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type='submit'
                    disabled={pending}
                    className='flex flex-row gap-5 px-4 py-2.5 cursor-pointer w-full items-center justify-between hover:bg-accent transition-colors'
                  >
                    <p className='text-sm text-foreground'>
                      {organization.name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {organization.pivot.role}
                    </p>
                  </button>
                )}
              </>
            </form>
          ))}

          <button
            onClick={() => {
              setOpen(false);
              push(`${ROUTES.DASHBOARD.ORGANIZATION}/create`);
            }}
            type='button'
            className='w-full px-4 py-3 text-left
                       text-sm font-medium text-primary
                       hover:bg-accent transition-colors'
          >
            + {BUTTON.CREATE}
          </button>
        </div>
      )}
    </div>
  );
}
