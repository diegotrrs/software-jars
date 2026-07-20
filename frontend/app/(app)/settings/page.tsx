import { SyncSettings } from '@/components/sync-settings';
import { getTranslations } from 'next-intl/server';

const SettingsPage = async () => {
  const t = await getTranslations('settings');

  return (
    <div className='p-6'>
      <h1 className='text-xl font-bold'>{t('title')}</h1>
      <SyncSettings />
    </div>
  );
};

export default SettingsPage;
