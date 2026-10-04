import { UuidGenerator } from '@/components/jars/uuid-generator/uuid-generator';
import { getTranslations } from 'next-intl/server';

const UuidGeneratorPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.uuidGenerator.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.uuidGenerator.description')}</p>
      </div>
      <UuidGenerator />
    </div>
  );
};

export default UuidGeneratorPage;
