import { Base64Tool } from '@/components/jars/base64/base64-tool';
import { getTranslations } from 'next-intl/server';

const Base64Page = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.base64.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.base64.description')}</p>
      </div>
      <Base64Tool />
    </div>
  );
};

export default Base64Page;
