import { ProjectsList } from '@/components/jars/idea-matrix/projects-list';
import { getTranslations } from 'next-intl/server';

const IdeaMatrixPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.ideaMatrix.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.ideaMatrix.description')}</p>
      </div>
      <ProjectsList />
    </div>
  );
};

export default IdeaMatrixPage;
