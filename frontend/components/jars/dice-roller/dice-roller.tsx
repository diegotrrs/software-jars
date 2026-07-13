'use client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DiceFace } from '@/components/jars/dice-roller/dice-face';
import { DIE_SIDES, type DieSides, MAX_DICE_COUNT, MIN_DICE_COUNT, rollDice } from '@/lib/dice';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const ROLL_DURATION_MS = 600;
const MAX_HISTORY_ENTRIES = 5;

type RollHistoryEntry = {
  id: number;
  sides: DieSides;
  count: number;
  results: number[];
  total: number;
};

export const DiceRoller = () => {
  const t = useTranslations('diceRoller');
  const [sides, setSides]     = useState<DieSides>(6);
  const [count, setCount]     = useState(1);
  const [rolling, setRolling] = useState(false);
  const [results, setResults] = useState<number[] | null>(null);
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);

  const total = results?.reduce((sum, r) => sum + r, 0) ?? null;

  const updateSides = (value: string) => {
    setSides(Number(value) as DieSides);
    setResults(null);
  };

  const updateCount = (next: number) => {
    setCount(Math.min(MAX_DICE_COUNT, Math.max(MIN_DICE_COUNT, next)));
    setResults(null);
  };

  const handleRoll = () => {
    setRolling(true);
    setResults(null);

    window.setTimeout(() => {
      const rolled = rollDice(count, sides);
      const rolledTotal = rolled.reduce((sum, r) => sum + r, 0);

      setResults(rolled);
      setRolling(false);
      setHistory((prev) =>
        [{ id: Date.now(), sides, count, results: rolled, total: rolledTotal }, ...prev].slice(0, MAX_HISTORY_ENTRIES)
      );
    }, ROLL_DURATION_MS);
  };

  return (
    <div className='mx-auto flex max-w-md flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-muted-foreground'>{t('sidesLabel')}</label>
          <Select value={String(sides)} onValueChange={updateSides}>
            <SelectTrigger data-testid='sides-select' className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIE_SIDES.map((s) => (
                <SelectItem key={s} value={String(s)}>d{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-muted-foreground'>{t('countLabel')}</label>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              data-testid='count-decrement'
              onClick={() => updateCount(count - 1)}
              disabled={count <= MIN_DICE_COUNT}
            >
              <Minus className='h-4 w-4' />
            </Button>
            <span data-testid='dice-count-value' className='w-6 text-center text-sm font-medium'>{count}</span>
            <Button
              variant='outline'
              size='icon'
              data-testid='count-increment'
              onClick={() => updateCount(count + 1)}
              disabled={count >= MAX_DICE_COUNT}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <Button data-testid='roll-button' size='lg' onClick={handleRoll} disabled={rolling}>
        {rolling ? t('rolling') : t('rollButton')}
      </Button>

      {(rolling || results) && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap justify-center gap-2'>
            {Array.from({ length: count }, (_, i) => (
              <DiceFace key={i} sides={sides} finalValue={results?.[i] ?? null} rolling={rolling} />
            ))}
          </div>
          {total !== null && (
            <p data-testid='roll-total' className='text-center text-2xl font-bold'>
              {t('total')}: {total}
            </p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className='flex flex-col gap-2 border-t pt-4'>
          <span className='text-sm font-medium text-muted-foreground'>{t('resultsLabel')}</span>
          <ul data-testid='roll-history' className='flex flex-col gap-1 text-sm'>
            {history.map((entry) => (
              <li key={entry.id} className='flex justify-between text-muted-foreground'>
                <span>{entry.count}d{entry.sides}</span>
                <span>{entry.results.join(', ')} = {entry.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
