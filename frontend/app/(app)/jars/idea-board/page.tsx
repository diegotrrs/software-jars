import { BoardsList } from '@/components/jars/idea-board/boards-list';
import { getTranslations } from 'next-intl/server';

const IdeaBoardPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.ideaBoard.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.ideaBoard.description')}</p>
      </div>
      <BoardsList />
    </div>
  );
};

export default IdeaBoardPage;
