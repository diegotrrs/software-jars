import { JarCard } from '@/components/jars/jar-card';
import { jars } from '@/lib/jars';
import { getTranslations } from 'next-intl/server';

const HomePage = async () => {
  const t = await getTranslations('home');

  return (
    <div className='p-6'>
      <section>
        <h1 className='text-xl font-bold'>{t('jarsSectionTitle')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jarsSectionDescription')}</p>

        <div className='mt-6 flex flex-wrap gap-4'>
          {jars.map((jar) => (
            <JarCard key={jar.id} jar={jar} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
