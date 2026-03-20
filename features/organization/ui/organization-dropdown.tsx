'use client';

import { ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useState,
  useActionState,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { setActiveOrganization } from '@/features/organization/api/organization';
import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';

import type { OrganizationProps } from '@/entities/organization';

/**
 *
 */
const subscribeToMount = () => {
  return noop;
};

/**
 *
 */
const getMountedSnapshot = () => {
  return true;
};

/**
 *
 */
const getServerMountedSnapshot = () => {
  return false;
};

/**
 *
 */
function noop() {}

/**
 * OrgItem — renders a single organization row inside the dropdown.
 * @param root0 - Props.
 * @param root0.organization - Organization to render.
 * @param root0.isActive - Whether this org is currently active.
 * @param root0.pending - Whether a form action is in flight.
 * @param root0.onSettingsClick - Click handler for the settings icon.
 * @returns JSX element.
 */
function OrgItem({
  organization,
  isActive,
  pending,
  onSettingsClick,
}: {
  organization: OrganizationProps;
  isActive: boolean;
  pending: boolean;
  onSettingsClick: () => void;
}) {
  if (isActive) {
    return (
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
          onClick={onSettingsClick}
        >
          <Settings size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      type='submit'
      disabled={pending}
      className='flex flex-row gap-5 px-4 py-2.5 cursor-pointer w-full items-center justify-between hover:bg-accent transition-colors'
    >
      <p className='text-sm text-foreground'>{organization.name}</p>
      <p className='text-xs text-muted-foreground'>{organization.pivot.role}</p>
    </button>
  );
}

/**
 * OrganizationDropdown component.
 * @param root0
 * @param root0.organizations
 * @param root0.organizationActiveId
 * @returns JSX element.
 */
// eslint-disable-next-line complexity
export default function OrganizationDropdown({
  organizations,
  organizationActiveId,
}: {
  organizations: OrganizationProps[];
  organizationActiveId: number | null;
}) {
  const [open, setOpen] = useState(false);

  const isMounted = useSyncExternalStore(
    subscribeToMount,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );

  const [, action, pending] = useActionState(setActiveOrganization, {
    ok: false,
  });

  const { push } = useRouter();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  const active = organizations.find((o) => {
    return String(o.id) === String(organizationActiveId);
  });

  const sortedOrganizations = active
    ? [
        active,
        ...organizations.filter((o) => {
          return o.id !== active.id;
        }),
      ]
    : organizations;

  useEffect(() => {
    const needsDefault = !organizationActiveId && organizations.length > 0;

    if (needsDefault) {
      const formData = new FormData();

      formData.append('organization_id', String(organizations[0].id));
      action(formData);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    /**
     * handleClickOutside.
     * @param e - e.
     * @returns Result.
     */
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const isOutside =
        !buttonRef.current?.contains(target) &&
        !target.closest('[data-org-dropdown]');

      if (isOutside) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      return document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  /**
   * handleToggle.
   */
  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setDropdownPos({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 280 - 8),
        minWidth: rect.width,
      });
    }

    setOpen((prev) => {
      return !prev;
    });
  };

  if (!isMounted) {
    return (
      <div className='max-w-[130px] xs:max-w-[180px] sm:max-w-[260px]'>
        <div
          className='w-full rounded-[var(--radius-button)] bg-accent px-3 py-2 min-w-0'
          suppressHydrationWarning
        >
          <div className='text-left min-w-0 flex-1'>
            <div className='text-sm font-medium text-accent-foreground truncate'>
              {active?.name ?? 'Select organization'}
            </div>
            <div className='text-xs text-accent-foreground/70 truncate'>
              {active?.pivot?.role}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-[130px] xs:max-w-[180px] sm:max-w-[260px]'>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className='cursor-pointer w-full flex items-center justify-between gap-2
                   rounded-[var(--radius-button)] bg-accent px-3 py-2
                   hover:bg-accent/80 transition min-w-0'
      >
        <div className='text-left min-w-0 flex-1'>
          <div className='text-sm font-medium text-accent-foreground truncate'>
            {active?.name ?? 'Select organization'}
          </div>
          <div className='text-xs text-accent-foreground/70 truncate'>
            {active?.pivot?.role}
          </div>
        </div>

        {open ? (
          <ChevronUp size={18} className='text-primary flex-shrink-0' />
        ) : (
          <ChevronDown size={18} className='text-primary flex-shrink-0' />
        )}
      </button>

      {open &&
        dropdownPos &&
        createPortal(
          <div
            data-org-dropdown=''
            className='fixed z-[9999] rounded-[var(--radius-card)] bg-popover border border-border shadow-card overflow-hidden'
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              minWidth: dropdownPos.minWidth,
              maxWidth: '280px',
            }}
          >
            {sortedOrganizations.map((organization) => {
              return (
                <form
                  key={organization.id}
                  action={(formData) => {
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
                  <OrgItem
                    organization={organization}
                    isActive={organization.id === organizationActiveId}
                    pending={pending}
                    onSettingsClick={() => {
                      setOpen(false);
                      push(
                        `${ROUTES.DASHBOARD.ORGANIZATION}/${organization.id}`,
                      );
                    }}
                  />
                </form>
              );
            })}

            <button
              onClick={() => {
                setOpen(false);
                push(`${ROUTES.DASHBOARD.ORGANIZATION}/create`);
              }}
              type='button'
              className='cursor-pointer w-full px-4 py-3 text-left
                         text-sm font-medium text-primary
                         hover:bg-accent transition-colors'
            >
              + {BUTTON.CREATE}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
