'use client';
import { TimezoneRow } from '@/components/jars/timezone-converter/timezone-row';
import { ZoneSearch } from '@/components/jars/timezone-converter/zone-search';
import { Button } from '@/components/ui/button';
import { addZone, getLocalTimezone, removeZone } from '@/lib/timezone-converter';
import { useTimezoneConverterZones } from '@/lib/use-timezone-converter';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const LIVE_TICK_MS = 10_000;

// Formats a Date as the value a `datetime-local` input expects
// ("YYYY-MM-DDTHH:mm"), in the browser's own local time.
const toDateTimeLocalValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const TimezoneConverter = () => {
  const t = useTranslations('timezoneConverter');
  const zoneIds = useTimezoneConverterZones();

  const [now, setNow] = useState(() => new Date());
  const [customDateTime, setCustomDateTime] = useState<string | null>(null);

  // Both the browser's local timezone and "now" differ between the server
  // (which can't know the visitor's timezone, and renders at a different
  // instant than hydration) and the client — same class of bug as
  // top-bar.tsx's theme-icon mount guard. Nothing timezone/time-dependent
  // renders until after mounting client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe mount guard, not derived state
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), LIVE_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const localZoneId = getLocalTimezone();
  const referenceDate = customDateTime ? new Date(customDateTime) : now;
  const isLive = customDateTime === null;

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-4 p-6'>
      <div className='flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3'>
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-muted-foreground'>{t('referenceTimeLabel')}</label>
          <input
            type='datetime-local'
            value={customDateTime ?? toDateTimeLocalValue(now)}
            onChange={(e) => setCustomDateTime(e.target.value)}
            data-testid='reference-time-input'
            className='rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring'
          />
        </div>
        {!isLive && (
          <Button
            variant='outline'
            size='sm'
            className='gap-1'
            onClick={() => setCustomDateTime(null)}
            data-testid='reset-to-now'
          >
            <RotateCcw className='h-3.5 w-3.5' />
            {t('resetToNow')}
          </Button>
        )}
        {isLive && <span className='text-xs text-muted-foreground'>{t('liveLabel')}</span>}
      </div>

      <div className='flex flex-col gap-2'>
        <TimezoneRow zoneId={localZoneId} date={referenceDate} isLocal />
        {zoneIds.map((zoneId) => (
          <TimezoneRow key={zoneId} zoneId={zoneId} date={referenceDate} onRemove={() => removeZone(zoneId)} />
        ))}
      </div>

      <ZoneSearch excludeZoneIds={[localZoneId, ...zoneIds]} onAddZone={addZone} />
    </div>
  );
};
