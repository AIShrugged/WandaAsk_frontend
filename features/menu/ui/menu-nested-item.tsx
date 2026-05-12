'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ICONS_MAP } from '@/features/menu/lib/options';

import type { MenuProps } from '@/features/menu/model/types';

export function NestedMenuItem({
  item,
  level,
}: {
  item: MenuProps;
  level: number;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const pathname = usePathname();
  const fallbackHref = item.activeHref ?? item.href;
  const activeHrefs = item.activeHrefs ?? (fallbackHref ? [fallbackHref] : []);
  const isActive = activeHrefs.some((href) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  });
  const [isOpen, setIsOpen] = useState(isActive);

  const handleToggle = () => {
    if (hasChildren) setIsOpen(!isOpen);
  };

  const Icon = item.icon ? ICONS_MAP[item.icon] : null;

  const Content = (
    <div
      className={[
        'flex items-center gap-3 px-4 py-1.5 min-h-[36px] rounded-[var(--r-md)] cursor-pointer',
        'transition-all duration-200 text-sm font-medium',
        // TRIBES nav-item active: inset border, not filled background
        isActive
          ? 'text-[var(--sidebar-accent-foreground)] shadow-[inset_0_0_0_1px_var(--sidebar-border)] bg-[var(--sidebar-accent)]'
          : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/40 hover:text-[var(--sidebar-accent-foreground)]',
      ].join(' ')}
      style={{ paddingLeft: `${level * 16 + 16}px` }}
      onClick={handleToggle}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
        />
      )}
      <span className='flex-1 truncate'>{item.label}</span>
      {hasChildren && (
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className='w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0' />
        </motion.div>
      )}
    </div>
  );

  return (
    <div>
      {item.href && !hasChildren ? (
        <Link href={item.href}>{Content}</Link>
      ) : (
        Content
      )}

      {hasChildren && isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          {item.children?.map((child) => {
            return (
              <NestedMenuItem key={child.id} item={child} level={level + 1} />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
