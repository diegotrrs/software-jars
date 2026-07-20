'use client';
import { Button } from '@/components/ui/button';
import { clearSyncCode, generateSyncCode, setSyncCode } from '@/lib/sync-code';
import { useSyncCode } from '@/lib/use-sync-code';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export const SyncSettings = () => {
  const t = useTranslations('sync');
  const code = useSyncCode();
  const [linkDraft, setLinkDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLink = () => {
    const trimmed = linkDraft.trim();
    if (!trimmed) return;
    setSyncCode(trimmed);
    setLinkDraft('');
  };

  const handleReset = () => {
    const confirmed = window.confirm(t('resetConfirm'));
    if (!confirmed) return;
    clearSyncCode();
  };

  return (
    <div className='mt-6 flex max-w-md flex-col gap-3 rounded-lg border p-4'>
      <div>
        <h2 className='font-medium'>{t('title')}</h2>
        <p className='text-sm text-muted-foreground'>{t('description')}</p>
      </div>

      {code ? (
        <div className='flex flex-col gap-2'>
          <p className='text-sm text-muted-foreground'>{t('linkedStatus')}</p>
          <div className='flex items-center gap-2'>
            <code data-testid='sync-code-value' className='truncate rounded border bg-muted px-2 py-1 text-xs'>
              {code}
            </code>
            <Button variant='outline' size='sm' onClick={handleCopy} data-testid='copy-sync-code'>
              {copied ? t('copied') : t('copy')}
            </Button>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='w-fit text-muted-foreground'
            onClick={handleReset}
            data-testid='reset-sync-code'
          >
            {t('reset')}
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-muted-foreground'>{t('notLinkedStatus')}</p>
          <Button size='sm' className='w-fit' onClick={() => generateSyncCode()} data-testid='generate-sync-code'>
            {t('generate')}
          </Button>

          <div className='flex items-center gap-2'>
            <input
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder={t('linkPlaceholder')}
              data-testid='link-sync-code-input'
              className='w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring'
            />
            <Button variant='outline' size='sm' onClick={handleLink} data-testid='link-sync-code'>
              {t('link')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
