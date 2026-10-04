import { beforeEach, describe, expect, it } from 'vitest';
import {
  addZone,
  getAllTimezones,
  getSnapshot,
  getZoneInfo,
  removeZone,
  resetTimezoneConverterStoreForTests,
  searchTimezones,
  zoneDisplayName,
} from './timezone-converter';

beforeEach(() => {
  resetTimezoneConverterStoreForTests();
});

describe('addZone / removeZone', () => {
  it('adds a zone to the stored list', () => {
    addZone('America/New_York');
    expect(getSnapshot().zoneIds).toEqual(['America/New_York']);
  });

  it('does not add the same zone twice', () => {
    addZone('America/New_York');
    addZone('America/New_York');
    expect(getSnapshot().zoneIds).toEqual(['America/New_York']);
  });

  it('removes a zone from the stored list', () => {
    addZone('America/New_York');
    addZone('Europe/London');
    removeZone('America/New_York');
    expect(getSnapshot().zoneIds).toEqual(['Europe/London']);
  });

  it('does nothing when removing a zone that was never added', () => {
    addZone('Europe/London');
    removeZone('Asia/Tokyo');
    expect(getSnapshot().zoneIds).toEqual(['Europe/London']);
  });
});

describe('getAllTimezones', () => {
  it('returns a large list of IANA zone ids', () => {
    const zones = getAllTimezones();
    expect(zones.length).toBeGreaterThan(100);
    expect(zones).toContain('America/New_York');
    expect(zones).toContain('Europe/London');
  });
});

describe('searchTimezones', () => {
  it('returns every zone when the query is empty', () => {
    expect(searchTimezones('')).toEqual(getAllTimezones());
  });

  it('matches by the city portion of the zone id, case-insensitively', () => {
    const results = searchTimezones('new york');
    expect(results).toContain('America/New_York');
  });

  it('matches by the full zone id too', () => {
    const results = searchTimezones('europe/london');
    expect(results).toEqual(['Europe/London']);
  });

  it('excludes zones passed in excludeZoneIds', () => {
    const results = searchTimezones('new york', ['America/New_York']);
    expect(results).not.toContain('America/New_York');
  });

  it('returns no results for a query matching nothing', () => {
    expect(searchTimezones('not-a-real-place-xyz')).toEqual([]);
  });
});

describe('getZoneInfo', () => {
  it('formats a known instant in a known zone using 24-hour time', () => {
    // 2026-01-15T12:00:00Z is noon UTC.
    const date = new Date('2026-01-15T12:00:00Z');
    const info = getZoneInfo(date, 'UTC', 'en');
    expect(info.time).toBe('12:00');
    expect(info.weekday).toBe('Thu');
  });

  it('reflects a different wall-clock time in a different zone for the same instant', () => {
    const date = new Date('2026-01-15T12:00:00Z');
    const utc = getZoneInfo(date, 'UTC', 'en');
    const tokyo = getZoneInfo(date, 'Asia/Tokyo', 'en');
    expect(tokyo.time).not.toBe(utc.time);
  });

  it('includes a GMT offset label', () => {
    const date = new Date('2026-01-15T12:00:00Z');
    const info = getZoneInfo(date, 'UTC', 'en');
    expect(info.offsetLabel).toMatch(/GMT/);
  });
});

describe('zoneDisplayName', () => {
  it('turns the city portion of a zone id into a readable label', () => {
    expect(zoneDisplayName('America/New_York')).toBe('New York');
    expect(zoneDisplayName('Europe/London')).toBe('London');
  });

  it('falls back to the raw id if there is no slash', () => {
    expect(zoneDisplayName('UTC')).toBe('UTC');
  });
});
