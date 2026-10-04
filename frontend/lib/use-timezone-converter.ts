'use client';
import { useSyncExternalStore } from 'react';
import { getServerSnapshot, getSnapshot, subscribe } from '@/lib/timezone-converter';

export const useTimezoneConverterZones = (): string[] => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return state.zoneIds;
};
