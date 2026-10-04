import { createLocalStorageStore } from '@/lib/local-storage-store';

const STORAGE_KEY = 'software-jars:timezone-converter';

type TimezoneConverterState = {
  // The user's own local timezone is always shown first and is never part
  // of this list — these are just the *additional* zones added for
  // comparison.
  zoneIds: string[];
};

const store = createLocalStorageStore<TimezoneConverterState>(
  STORAGE_KEY,
  { zoneIds: [] },
  { syncNamespace: 'timezone-converter' }
);

export const subscribe = store.subscribe;
export const getSnapshot = store.getSnapshot;
export const getServerSnapshot = store.getServerSnapshot;
export const resetTimezoneConverterStoreForTests = store.resetForTests;
const writeState = store.writeState;

export const addZone = (zoneId: string): void => {
  const state = getSnapshot();
  if (state.zoneIds.includes(zoneId)) return;
  writeState({ zoneIds: [...state.zoneIds, zoneId] });
};

export const removeZone = (zoneId: string): void => {
  const state = getSnapshot();
  writeState({ zoneIds: state.zoneIds.filter((id) => id !== zoneId) });
};

export const getLocalTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

// Every IANA zone name the runtime knows about, e.g. "America/New_York".
// Cached after the first call — the list is static for a given browser/OS.
let allTimezonesCache: string[] | null = null;
export const getAllTimezones = (): string[] => {
  if (!allTimezonesCache) allTimezonesCache = Intl.supportedValuesOf('timeZone');
  return allTimezonesCache;
};

// Matches against both the full IANA id ("America/New_York") and the
// "city" part after the last slash, so searching "york" or "new york"
// both find it, not just the full path.
export const searchTimezones = (query: string, excludeZoneIds: string[] = []): string[] => {
  const normalized = query.trim().toLowerCase();
  const excluded = new Set(excludeZoneIds);
  const candidates = getAllTimezones().filter((zoneId) => !excluded.has(zoneId));
  if (!normalized) return candidates;
  return candidates.filter((zoneId) => zoneId.toLowerCase().replace(/_/g, ' ').includes(normalized));
};

export type ZoneInfo = {
  weekday: string;
  dateLabel: string;
  time: string;
  offsetLabel: string;
};

// A consistent 24-hour format is used for every zone regardless of the
// page's locale — the whole point of this jar is scanning several times
// at a glance, which is harder if some rows are "2:30 PM" and others are
// "14:30" depending on each zone's own locale convention.
export const getZoneInfo = (date: Date, timeZone: string, locale: string): ZoneInfo => {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';

  return {
    weekday: get('weekday'),
    dateLabel: `${get('month')} ${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    offsetLabel: get('timeZoneName'),
  };
};

// Turns a city/zone name into a readable label: "America/New_York" -> "New York".
export const zoneDisplayName = (zoneId: string): string => zoneId.split('/').pop()?.replace(/_/g, ' ') ?? zoneId;
