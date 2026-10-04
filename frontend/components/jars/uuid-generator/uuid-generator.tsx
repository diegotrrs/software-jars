'use client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateUuid, type UuidVersion } from '@/lib/uuid-generator';
import { Check, Copy, Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const COPIED_RESET_MS = 1500;

export const UuidGenerator = () => {
  const t = useTranslations('uuidGenerator');
  const [version, setVersion] = useState<UuidVersion>(4);
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const updateCount = (next: number) => setCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, next)));

  const handleGenerate = () => {
    setUuids(Array.from({ length: count }, () => generateUuid(version)));
    setCopiedIndex(null);
    setCopiedAll(false);
  };

  const copyOne = async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), COPIED_RESET_MS);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), COPIED_RESET_MS);
  };

  return (
    <div className='mx-auto flex max-w-md flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-muted-foreground'>{t('versionLabel')}</label>
          <Select value={String(version)} onValueChange={(value) => setVersion(Number(value) as UuidVersion)}>
            <SelectTrigger data-testid='version-select' className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='4'>{t('v4Label')}</SelectItem>
              <SelectItem value='1'>{t('v1Label')}</SelectItem>
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
              disabled={count <= MIN_COUNT}
            >
              <Minus className='h-4 w-4' />
            </Button>
            <span data-testid='uuid-count-value' className='w-6 text-center text-sm font-medium'>
              {count}
            </span>
            <Button
              variant='outline'
              size='icon'
              data-testid='count-increment'
              onClick={() => updateCount(count + 1)}
              disabled={count >= MAX_COUNT}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <Button data-testid='generate-button' size='lg' onClick={handleGenerate}>
        {t('generateButton')}
      </Button>

      {uuids.length > 0 && (
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-muted-foreground'>{t('resultsLabel')}</span>
            <div className='flex gap-1'>
              <Button variant='ghost' size='sm' className='gap-1' onClick={copyAll} data-testid='copy-all'>
                {copiedAll ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {t('copyAll')}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='gap-1'
                onClick={() => setUuids([])}
                data-testid='clear-results'
              >
                <Trash2 className='h-3.5 w-3.5' />
                {t('clear')}
              </Button>
            </div>
          </div>

          <ul data-testid='uuid-list' className='flex flex-col gap-1'>
            {uuids.map((uuid, index) => (
              <li
                key={`${uuid}-${index}`}
                data-testid='uuid-row'
                className='flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 font-mono text-sm'
              >
                <span className='truncate'>{uuid}</span>
                <button
                  type='button'
                  onClick={() => copyOne(uuid, index)}
                  aria-label={t('copyOne')}
                  data-testid='copy-uuid'
                  className='shrink-0 text-muted-foreground hover:text-foreground'
                >
                  {copiedIndex === index ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
