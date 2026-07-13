'use client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
}                           from '@/components/ui/tooltip';
import { navItems }         from '@/lib/nav';
import { cn }               from '@/lib/utils';
import { useTranslations }  from 'next-intl';
import Link                 from 'next/link';
import { usePathname }      from 'next/navigation';

const NavLink = ({ item, isActive, label }: { item: typeof navItems[number]; isActive: boolean; label: string }) => {
  const Icon = item.icon;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          data-testid={item.testId}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className='h-5 w-5' />
          <span className='sr-only'>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side='right'>{label}</TooltipContent>
    </Tooltip>
  );
};

export const DesktopSidebar = () => {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const mainItems   = navItems.filter((i) => i.section === 'main');
  const bottomItems = navItems.filter((i) => i.section === 'bottom');

  return (
    <TooltipProvider>
      <aside className='hidden md:flex fixed left-0 top-14 bottom-0 z-40 w-16 flex-col items-center border-r bg-background py-4'>
        <nav className='flex flex-1 flex-col items-center gap-2'>
          {mainItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} label={t(item.labelKey)} />
          ))}
        </nav>

        <nav className='flex flex-col items-center gap-2'>
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} label={t(item.labelKey)} />
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
};
