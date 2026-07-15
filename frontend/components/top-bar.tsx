'use client';
import { Button }           from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Logo }             from '@/components/logo';
import { useTranslations }  from 'next-intl';
import { useTheme }         from 'next-themes';
import { Moon, Sun }        from 'lucide-react';
import { useEffect, useState } from 'react';

export const TopBar = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('topBar');

  // resolvedTheme is undefined during SSR (the server can't know the client's
  // preference), so rendering it directly causes a hydration mismatch — wait
  // until mounted client-side before showing the theme-dependent icon.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes SSR-safe mount guard, not derived state
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <header className='sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4'>
      <div className='flex items-center gap-2'>
        <Logo />
        <span className='text-lg font-bold tracking-tight select-none'>{t('appName')}</span>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={t('toggleTheme')}
        >
          {isDark ? (
            <Sun className='h-4 w-4' />
          ) : (
            <Moon className='h-4 w-4' />
          )}
        </Button>

        <LanguageSwitcher />
      </div>
    </header>
  );
};
