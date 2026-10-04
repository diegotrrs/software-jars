import { TimezoneConverter } from '@/components/jars/timezone-converter/timezone-converter';
import { getTranslations } from 'next-intl/server';

const TimezoneConverterPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.timezoneConverter.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.timezoneConverter.description')}</p>
      </div>
      <TimezoneConverter />
    </div>
  );
};

export default TimezoneConverterPage;
