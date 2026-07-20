'use client';
import { useSyncExternalStore } from 'react';
import { getServerSnapshot, getSnapshot, subscribe, type Project } from '@/lib/idea-matrix';

export const useIdeaMatrixProjects = (): Project[] => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return state.projects;
};
