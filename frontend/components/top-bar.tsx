'use client';
import { Button }           from '@/components/ui/button';
import { Logo }             from '@/components/logo';
import { useTranslations }  from 'next-intl';
import { useTheme }         from 'next-themes';
import { Globe, Moon, Sun } from 'lucide-react';

export const TopBar = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('topBar');

  return (
    <header className='sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4'>
      <div className='flex items-center gap-2'>
        <Logo />
        <span className='text-lg font-bold tracking-tight select-none'>{t('appName')}</span>
      </div>

      <div className='flex items-center gap-2'>
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={t('toggleTheme')}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className='h-4 w-4' />
            ) : (
              <Moon className='h-4 w-4' />
            )}
          </Button>
        )}

        <Button
          variant='ghost'
          size='icon'
          disabled
          aria-label={t('language')}
          title={t('language')}
        >
          <Globe className='h-4 w-4' />
        </Button>
      </div>
    </header>
  );
};
