'use client';
import { Button } from '@/components/ui/button';
import { formatJson, minifyJson, validateJson } from '@/lib/json-formatter';
import { Check, Copy, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const COPIED_RESET_MS = 1500;

export const JsonFormatter = () => {
  const t = useTranslations('jsonFormatter');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validMessage, setValidMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    const result = formatJson(input);
    setValidMessage(null);
    if (result.success) {
      setInput(result.value);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  const handleMinify = () => {
    const result = minifyJson(input);
    setValidMessage(null);
    if (result.success) {
      setInput(result.value);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  const handleValidate = () => {
    const result = validateJson(input);
    if (result.valid) {
      setError(null);
      setValidMessage(t('validMessage'));
    } else {
      setValidMessage(null);
      setError(result.error);
    }
  };

  const handleClear = () => {
    setInput('');
    setError(null);
    setValidMessage(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-4 p-6'>
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
          setValidMessage(null);
        }}
        placeholder={t('placeholder')}
        data-testid='json-input'
        spellCheck={false}
        className='h-80 w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-ring'
      />

      {error && (
        <p data-testid='json-error' className='text-sm text-destructive'>
          {error}
        </p>
      )}
      {validMessage && (
        <p data-testid='json-valid' className='text-sm text-green-600 dark:text-green-500'>
          {validMessage}
        </p>
      )}

      <div className='flex flex-wrap gap-2'>
        <Button onClick={handleFormat} data-testid='format-button'>
          {t('formatButton')}
        </Button>
        <Button variant='outline' onClick={handleMinify} data-testid='minify-button'>
          {t('minifyButton')}
        </Button>
        <Button variant='outline' onClick={handleValidate} data-testid='validate-button'>
          {t('validateButton')}
        </Button>
        <div className='flex-1' />
        <Button variant='ghost' className='gap-1' onClick={handleCopy} data-testid='copy-button' disabled={!input}>
          {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
          {t('copyButton')}
        </Button>
        <Button variant='ghost' className='gap-1' onClick={handleClear} data-testid='clear-button' disabled={!input}>
          <Trash2 className='h-4 w-4' />
          {t('clearButton')}
        </Button>
      </div>
    </div>
  );
};
