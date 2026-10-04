'use client';
import { searchTimezones, zoneDisplayName } from '@/lib/timezone-converter';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type ZoneSearchProps = {
  excludeZoneIds: string[];
  onAddZone: (zoneId: string) => void;
};

const MAX_RESULTS = 30;

export const ZoneSearch = ({ excludeZoneIds, onAddZone }: ZoneSearchProps) => {
  const t = useTranslations('timezoneConverter');
  const [query, setQuery] = useState('');
  const results = searchTimezones(query, excludeZoneIds).slice(0, MAX_RESULTS);

  return (
    <div className='flex flex-col gap-2 rounded-lg border p-3' data-testid='zone-search'>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        data-testid='zone-search-input'
        className='w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring'
      />
      {query && (
        <ul className='flex max-h-48 flex-col gap-0.5 overflow-y-auto' data-testid='zone-search-results'>
          {results.length === 0 && <li className='px-2 py-1 text-xs text-muted-foreground'>{t('noZonesFound')}</li>}
          {results.map((zoneId) => (
            <li key={zoneId}>
              <button
                type='button'
                onClick={() => {
                  onAddZone(zoneId);
                  setQuery('');
                }}
                data-testid='zone-search-result'
                className='flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-accent'
              >
                <span>{zoneDisplayName(zoneId)}</span>
                <span className='text-xs text-muted-foreground'>{zoneId}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
