'use client';
import { getZoneInfo, zoneDisplayName } from '@/lib/timezone-converter';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type TimezoneRowProps = {
  zoneId: string;
  date: Date;
  isLocal?: boolean;
  onRemove?: () => void;
};

export const TimezoneRow = ({ zoneId, date, isLocal = false, onRemove }: TimezoneRowProps) => {
  const t = useTranslations('timezoneConverter');
  const locale = useLocale();
  const info = getZoneInfo(date, zoneId, locale);

  return (
    <div
      data-testid='timezone-row'
      data-zone-id={zoneId}
      className='flex items-center justify-between gap-3 rounded-lg border p-3'
    >
      <div className='flex flex-col'>
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{zoneDisplayName(zoneId)}</span>
          {isLocal && (
            <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
              {t('youLabel')}
            </span>
          )}
        </div>
        <span className='text-xs text-muted-foreground'>
          {zoneId} · {info.offsetLabel}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        <div className='text-right'>
          <div data-testid='timezone-time' className='text-lg font-semibold tabular-nums'>
            {info.time}
          </div>
          <div className='text-xs text-muted-foreground'>
            {info.weekday}, {info.dateLabel}
          </div>
        </div>
        {onRemove && (
          <button
            type='button'
            onClick={onRemove}
            aria-label={t('removeZone', { zone: zoneDisplayName(zoneId) })}
            data-testid='remove-zone'
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>
    </div>
  );
};
