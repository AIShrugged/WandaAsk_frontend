'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ICONS_MAP } from '@/features/menu/lib/options';

import type { MenuProps } from '@/features/menu/model/types';

/**
 * NestedMenuItem component.
 * @param root0
 * @param root0.item
 * @param root0.level
 */
export function NestedMenuItem({
  item,
  level,
}: {
  item: MenuProps;
  level: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const pathname = usePathname();
  const activeHref = item.activeHref ?? item.href;
  const isActive = activeHref
    ? pathname === activeHref || pathname.startsWith(`${activeHref}/`)
    : false;
  /**
   * handleToggle.
   */
  const handleToggle = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };
  const Icon = item.icon ? ICONS_MAP[item.icon] : null;
  const Content = (
    <div
      className={`
        flex items-center gap-3 px-4 py-2 min-h-[36px] rounded-md cursor-pointer
        transition-all duration-200
        ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
        }
      `}
      style={{ paddingLeft: `${level * 16 + 16}px` }}
      onClick={handleToggle}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        />
      )}
      <span className='flex-1 text-sm font-medium'>{item.label}</span>
      {hasChildren && (
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className='w-4 h-4 text-muted-foreground' />
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
