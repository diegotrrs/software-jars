'use client';
import { Button } from '@/components/ui/button';
import { decodeBase64, encodeBase64 } from '@/lib/base64';
import { ArrowLeftRight, Check, Copy, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const COPIED_RESET_MS = 1500;

export const Base64Tool = () => {
  const t = useTranslations('base64');
  const [text, setText] = useState('');
  const [encoded, setEncoded] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'text' | 'encoded' | null>(null);

  const handleEncode = () => {
    setEncoded(encodeBase64(text));
    setError(null);
  };

  const handleDecode = () => {
    const result = decodeBase64(encoded);
    if (result.success) {
      setText(result.value);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  const handleClear = () => {
    setText('');
    setEncoded('');
    setError(null);
  };

  const copy = async (field: 'text' | 'encoded', value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), COPIED_RESET_MS);
  };

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-4 p-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium text-muted-foreground'>{t('textLabel')}</label>
            <button
              type='button'
              onClick={() => copy('text', text)}
              aria-label={t('copyText')}
              data-testid='copy-text'
              disabled={!text}
              className='text-muted-foreground hover:text-foreground disabled:opacity-40'
            >
              {copiedField === 'text' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder={t('textPlaceholder')}
            data-testid='base64-text'
            spellCheck={false}
            className='h-56 w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-ring'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium text-muted-foreground'>{t('base64Label')}</label>
            <button
              type='button'
              onClick={() => copy('encoded', encoded)}
              aria-label={t('copyBase64')}
              data-testid='copy-encoded'
              disabled={!encoded}
              className='text-muted-foreground hover:text-foreground disabled:opacity-40'
            >
              {copiedField === 'encoded' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
          <textarea
            value={encoded}
            onChange={(e) => {
              setEncoded(e.target.value);
              setError(null);
            }}
            placeholder={t('base64Placeholder')}
            data-testid='base64-encoded'
            spellCheck={false}
            className='h-56 w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-ring'
          />
        </div>
      </div>

      {error && (
        <p data-testid='base64-error' className='text-sm text-destructive'>
          {error}
        </p>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        <Button onClick={handleEncode} className='gap-1' data-testid='encode-button' disabled={!text}>
          {t('encodeButton')} <ArrowLeftRight className='h-4 w-4' />
        </Button>
        <Button onClick={handleDecode} className='gap-1' data-testid='decode-button' disabled={!encoded}>
          <ArrowLeftRight className='h-4 w-4' /> {t('decodeButton')}
        </Button>
        <div className='flex-1' />
        <Button
          variant='ghost'
          className='gap-1'
          onClick={handleClear}
          data-testid='clear-button'
          disabled={!text && !encoded}
        >
          <Trash2 className='h-4 w-4' />
          {t('clearButton')}
        </Button>
      </div>
    </div>
  );
};
