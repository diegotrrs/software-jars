'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { locales, type Locale } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export const LanguageSwitcher = () => {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations('topBar');
  const router = useRouter();

  const handleChange = (next: string) => {
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <Select value={currentLocale} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={t('language')}
        data-testid='language-switcher'
        className='h-9 w-24 gap-1 border-none px-2 text-xs shadow-none'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
