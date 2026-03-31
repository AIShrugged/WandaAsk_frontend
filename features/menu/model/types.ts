import { ICONS_MAP } from '@/features/menu/lib/options';

export interface MenuProps {
  id: string;
  label: string;
  icon?: keyof typeof ICONS_MAP;
  href?: string;
  activeHref?: string;
  activeHrefs?: string[];
  children?: MenuProps[];
  position: number;
}
