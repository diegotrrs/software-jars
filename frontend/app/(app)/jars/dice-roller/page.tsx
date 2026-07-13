import { DiceRoller } from '@/components/jars/dice-roller/dice-roller';
import { getTranslations } from 'next-intl/server';

const DiceRollerPage = async () => {
  const t = await getTranslations();

  return (
    <div>
      <div className='px-6 pt-6'>
        <h1 className='text-xl font-bold'>{t('jars.diceRoller.name')}</h1>
        <p className='text-sm text-muted-foreground'>{t('jars.diceRoller.description')}</p>
      </div>
      <DiceRoller />
    </div>
  );
};

export default DiceRollerPage;
