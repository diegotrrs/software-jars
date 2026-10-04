import { JsonFormatter } from '@/components/jars/json-formatter/json-formatter';
import { getTranslations } from 'next-intl/server';

const JsonFormatterPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.jsonFormatter.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.jsonFormatter.description')}</p>
      </div>
      <JsonFormatter />
    </div>
  );
};

export default JsonFormatterPage;
