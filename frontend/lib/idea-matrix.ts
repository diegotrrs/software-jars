import { createLocalStorageStore } from '@/lib/local-storage-store';
import type { VariableCategory } from '@/lib/variable-categories';

const STORAGE_KEY = 'software-jars:idea-matrix';

export type AxisOption = {
  id: string;
  label: string;
  favorite: boolean;
};

export type Axis = {
  id: string;
  name: string;
  options: AxisOption[];
};

export type Scores = {
  demand: number;
  competition: number;
  effort: number;
  differentiation: number;
};

export type Candidate = {
  id: string;
  name: string;
  selections: Record<string, string>; // axisId -> optionId
  lockedAxisIds: string[]; // axes randomizeCandidateSelections must leave untouched
  scores: Scores;
  notes: string;
};

export type Project = {
  id: string;
  name: string;
  axes: Axis[];
  candidates: Candidate[];
};

type IdeaMatrixState = {
  projects: Project[];
};

const DEFAULT_SCORES: Scores = { demand: 3, competition: 3, effort: 3, differentiation: 3 };

const store = createLocalStorageStore<IdeaMatrixState>(STORAGE_KEY, { projects: [] }, { syncNamespace: 'idea-matrix' });

export const subscribe = store.subscribe;
export const getSnapshot = store.getSnapshot;
export const getServerSnapshot = store.getServerSnapshot;
export const resetIdeaMatrixStoreForTests = store.resetForTests;
const writeState = store.writeState;

const generateId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// Candidates saved before the lock/randomize feature shipped have no
// lockedAxisIds in their persisted localStorage data — treat that as "no
// axes locked" rather than crashing on `.includes`/`.filter` of undefined.
const getLockedAxisIds = (candidate: Candidate): string[] => candidate.lockedAxisIds ?? [];

// Demand and differentiation pull the score up; competition and effort pull it down.
export const computeScore = (scores: Scores): number =>
  scores.demand + scores.differentiation - scores.competition - scores.effort;

const updateProject = (projectId: string, updater: (project: Project) => Project): void => {
  const state = getSnapshot();
  writeState({
    projects: state.projects.map((project) => (project.id === projectId ? updater(project) : project)),
  });
};

const updateAxis = (projectId: string, axisId: string, updater: (axis: Axis) => Axis): void => {
  updateProject(projectId, (project) => ({
    ...project,
    axes: project.axes.map((axis) => (axis.id === axisId ? updater(axis) : axis)),
  }));
};

const updateCandidate = (projectId: string, candidateId: string, updater: (candidate: Candidate) => Candidate): void => {
  updateProject(projectId, (project) => ({
    ...project,
    candidates: project.candidates.map((candidate) => (candidate.id === candidateId ? updater(candidate) : candidate)),
  }));
};

export const getProject = (projectId: string): Project | undefined =>
  getSnapshot().projects.find((project) => project.id === projectId);

export const createProject = (name: string): Project => {
  const state = getSnapshot();
  const project: Project = { id: generateId(), name, axes: [], candidates: [] };
  writeState({ projects: [...state.projects, project] });
  return project;
};

export const renameProject = (projectId: string, name: string): void => {
  const state = getSnapshot();
  writeState({
    projects: state.projects.map((project) => (project.id === projectId ? { ...project, name } : project)),
  });
};

export const deleteProject = (projectId: string): void => {
  const state = getSnapshot();
  writeState({ projects: state.projects.filter((project) => project.id !== projectId) });
};

export const addAxis = (projectId: string, name: string): Axis => {
  const axis: Axis = { id: generateId(), name, options: [] };
  updateProject(projectId, (project) => ({ ...project, axes: [...project.axes, axis] }));
  return axis;
};

export const renameAxis = (projectId: string, axisId: string, name: string): void => {
  updateAxis(projectId, axisId, (axis) => ({ ...axis, name }));
};

// Adds a whole pre-populated category as a brand-new axis (fresh ids
// throughout — the category's own ids are only used to keep its en/es
// translations aligned, not carried into the project's data). Behaves
// exactly like a manually-built axis afterward; can be added more than
// once, nothing tracks which categories were already used.
export const addAxisFromCategory = (projectId: string, category: VariableCategory): Axis => {
  const axis: Axis = {
    id: generateId(),
    name: category.name,
    options: category.options.map((option) => ({ id: generateId(), label: option.label, favorite: false })),
  };
  updateProject(projectId, (project) => ({ ...project, axes: [...project.axes, axis] }));
  return axis;
};

// Also strips this axis's key from every candidate's selections and lock
// state, since referencing a deleted axis is meaningless either way.
export const deleteAxis = (projectId: string, axisId: string): void => {
  updateProject(projectId, (project) => ({
    ...project,
    axes: project.axes.filter((axis) => axis.id !== axisId),
    candidates: project.candidates.map((candidate) => {
      const lockedAxisIds = getLockedAxisIds(candidate);
      if (!(axisId in candidate.selections) && !lockedAxisIds.includes(axisId)) return candidate;
      const selections = { ...candidate.selections };
      delete selections[axisId];
      return { ...candidate, selections, lockedAxisIds: lockedAxisIds.filter((id) => id !== axisId) };
    }),
  }));
};

export const addAxisOption = (projectId: string, axisId: string, label: string): AxisOption => {
  const option: AxisOption = { id: generateId(), label, favorite: false };
  updateAxis(projectId, axisId, (axis) => ({ ...axis, options: [...axis.options, option] }));
  return option;
};

export const renameAxisOption = (projectId: string, axisId: string, optionId: string, label: string): void => {
  updateAxis(projectId, axisId, (axis) => ({
    ...axis,
    options: axis.options.map((option) => (option.id === optionId ? { ...option, label } : option)),
  }));
};

export const toggleAxisOptionFavorite = (projectId: string, axisId: string, optionId: string): void => {
  updateAxis(projectId, axisId, (axis) => ({
    ...axis,
    options: axis.options.map((option) =>
      option.id === optionId ? { ...option, favorite: !option.favorite } : option
    ),
  }));
};

// Also clears any candidate selection that pointed at this option.
export const deleteAxisOption = (projectId: string, axisId: string, optionId: string): void => {
  updateProject(projectId, (project) => ({
    ...project,
    axes: project.axes.map((axis) =>
      axis.id === axisId ? { ...axis, options: axis.options.filter((option) => option.id !== optionId) } : axis
    ),
    candidates: project.candidates.map((candidate) => {
      if (candidate.selections[axisId] !== optionId) return candidate;
      const selections = { ...candidate.selections };
      delete selections[axisId];
      return { ...candidate, selections };
    }),
  }));
};

export const addCandidate = (projectId: string, name = ''): Candidate => {
  const candidate: Candidate = {
    id: generateId(),
    name,
    selections: {},
    lockedAxisIds: [],
    scores: { ...DEFAULT_SCORES },
    notes: '',
  };
  updateProject(projectId, (project) => ({ ...project, candidates: [...project.candidates, candidate] }));
  return candidate;
};

// Same as addCandidate, but pre-fills a random option for every axis that
// has at least one option (axes with no options are left unselected —
// nothing to pick from). Only the variable selections are randomized; name,
// scores, and notes start the same as a regular new candidate.
export const addRandomCandidate = (projectId: string): Candidate => {
  const project = getSnapshot().projects.find((p) => p.id === projectId);
  const selections: Record<string, string> = {};
  for (const axis of project?.axes ?? []) {
    if (axis.options.length === 0) continue;
    const randomOption = axis.options[Math.floor(Math.random() * axis.options.length)];
    selections[axis.id] = randomOption.id;
  }

  const candidate: Candidate = {
    id: generateId(),
    name: '',
    selections,
    lockedAxisIds: [],
    scores: { ...DEFAULT_SCORES },
    notes: '',
  };
  updateProject(projectId, (proj) => ({ ...proj, candidates: [...proj.candidates, candidate] }));
  return candidate;
};

export const renameCandidate = (projectId: string, candidateId: string, name: string): void => {
  updateCandidate(projectId, candidateId, (candidate) => ({ ...candidate, name }));
};

export const deleteCandidate = (projectId: string, candidateId: string): void => {
  updateProject(projectId, (project) => ({
    ...project,
    candidates: project.candidates.filter((candidate) => candidate.id !== candidateId),
  }));
};

export const setCandidateSelection = (
  projectId: string,
  candidateId: string,
  axisId: string,
  optionId: string | null
): void => {
  updateCandidate(projectId, candidateId, (candidate) => {
    const selections = { ...candidate.selections };
    if (optionId) selections[axisId] = optionId;
    else delete selections[axisId];
    return { ...candidate, selections };
  });
};

export const toggleCandidateAxisLock = (projectId: string, candidateId: string, axisId: string): void => {
  updateCandidate(projectId, candidateId, (candidate) => {
    const lockedAxisIds = getLockedAxisIds(candidate);
    return {
      ...candidate,
      lockedAxisIds: lockedAxisIds.includes(axisId)
        ? lockedAxisIds.filter((id) => id !== axisId)
        : [...lockedAxisIds, axisId],
    };
  });
};

// Re-rolls a random option for every axis that isn't in this candidate's
// lockedAxisIds (axes with no options are left as-is — nothing to pick
// from). Locked axes, including ones with no selection yet, are untouched.
export const randomizeCandidateSelections = (projectId: string, candidateId: string): void => {
  const project = getSnapshot().projects.find((p) => p.id === projectId);
  const candidate = project?.candidates.find((c) => c.id === candidateId);
  if (!project || !candidate) return;

  const lockedAxisIds = getLockedAxisIds(candidate);
  const selections = { ...candidate.selections };
  for (const axis of project.axes) {
    if (lockedAxisIds.includes(axis.id)) continue;
    if (axis.options.length === 0) continue;
    const randomOption = axis.options[Math.floor(Math.random() * axis.options.length)];
    selections[axis.id] = randomOption.id;
  }

  updateCandidate(projectId, candidateId, (c) => ({ ...c, selections }));
};

export const setCandidateScore = (
  projectId: string,
  candidateId: string,
  field: keyof Scores,
  value: number
): void => {
  updateCandidate(projectId, candidateId, (candidate) => ({
    ...candidate,
    scores: { ...candidate.scores, [field]: value },
  }));
};

export const setCandidateNotes = (projectId: string, candidateId: string, notes: string): void => {
  updateCandidate(projectId, candidateId, (candidate) => ({ ...candidate, notes }));
};
