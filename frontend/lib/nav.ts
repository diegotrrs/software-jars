import {
  House,
  Settings,
  type LucideIcon
} from 'lucide-react';

export type NavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  section: 'main' | 'bottom';
  testId: string;
};

export const navItems: NavItem[] = [
  {
    labelKey: 'home',
    href: '/',
    icon: House,
    section: 'main',
    testId: 'nav-home',
  },
  {
    labelKey: 'settings',
    href: '/settings',
    icon: Settings,
    section: 'bottom',
    testId: 'nav-settings',
  },
];
