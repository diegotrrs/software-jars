import { getTranslations } from 'next-intl/server';

const SettingsPage = async () => {
  const t = await getTranslations('settings');

  return (
    <div className='p-6'>
      <h1 className='text-xl font-bold'>{t('title')}</h1>
      <p className='mt-2 text-sm text-muted-foreground'>{t('comingSoon')}</p>
    </div>
  );
};

export default SettingsPage;
