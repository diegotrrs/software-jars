'use client';
import { useSyncExternalStore } from 'react';
import { getServerSnapshot, getSnapshot, subscribe, type Board } from '@/lib/idea-board';

export const useIdeaBoards = (): Board[] => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return state.boards;
};
