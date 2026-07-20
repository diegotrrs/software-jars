'use client';
import { useSyncExternalStore } from 'react';
import { getSyncCode, subscribeSyncCode } from '@/lib/sync-code';

export const useSyncCode = (): string | null =>
  useSyncExternalStore(subscribeSyncCode, getSyncCode, () => null);
