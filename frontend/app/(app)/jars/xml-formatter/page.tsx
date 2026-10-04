import { XmlFormatter } from '@/components/jars/xml-formatter/xml-formatter';
import { getTranslations } from 'next-intl/server';

const XmlFormatterPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.xmlFormatter.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.xmlFormatter.description')}</p>
      </div>
      <XmlFormatter />
    </div>
  );
};

export default XmlFormatterPage;
