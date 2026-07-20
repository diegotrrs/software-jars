import { beforeEach, describe, expect, it } from 'vitest';
import {
  addAxis,
  addAxisOption,
  addCandidate,
  computeScore,
  createProject,
  deleteAxis,
  deleteAxisOption,
  deleteCandidate,
  deleteProject,
  getProject,
  renameAxis,
  renameAxisOption,
  renameCandidate,
  renameProject,
  resetIdeaMatrixStoreForTests,
  setCandidateNotes,
  setCandidateScore,
  setCandidateSelection,
} from './idea-matrix';

beforeEach(() => {
  resetIdeaMatrixStoreForTests();
});

describe('projects', () => {
  it('creates a project and can retrieve it', () => {
    const project = createProject('Etsy AI mugs');
    expect(getProject(project.id)).toEqual(project);
    expect(project.axes).toEqual([]);
    expect(project.candidates).toEqual([]);
  });

  it('renames a project', () => {
    const project = createProject('Untitled project');
    renameProject(project.id, 'Renamed');
    expect(getProject(project.id)?.name).toBe('Renamed');
  });

  it('deletes a project', () => {
    const project = createProject('Temp');
    deleteProject(project.id);
    expect(getProject(project.id)).toBeUndefined();
  });

  it('does not affect other projects when mutating one', () => {
    const a = createProject('A');
    const b = createProject('B');
    renameProject(a.id, 'A renamed');
    expect(getProject(b.id)?.name).toBe('B');
  });
});

describe('axes', () => {
  it('adds an axis to a project', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    expect(getProject(project.id)?.axes).toEqual([axis]);
  });

  it('renames an axis', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    renameAxis(project.id, axis.id, 'Theme');
    expect(getProject(project.id)?.axes[0].name).toBe('Theme');
  });

  it('deletes an axis and clears candidate selections referencing it', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');
    const candidate = addCandidate(project.id, 'Idea 1');
    setCandidateSelection(project.id, candidate.id, axis.id, option.id);

    deleteAxis(project.id, axis.id);

    expect(getProject(project.id)?.axes).toEqual([]);
    expect(getProject(project.id)?.candidates[0].selections).toEqual({});
  });
});

describe('axis options', () => {
  it('adds an option to an axis', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');
    expect(getProject(project.id)?.axes[0].options).toEqual([option]);
  });

  it('renames an option', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');
    renameAxisOption(project.id, axis.id, option.id, 'Retro');
    expect(getProject(project.id)?.axes[0].options[0].label).toBe('Retro');
  });

  it('deletes an option and clears candidate selections pointing at it', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');
    const candidate = addCandidate(project.id, 'Idea 1');
    setCandidateSelection(project.id, candidate.id, axis.id, option.id);

    deleteAxisOption(project.id, axis.id, option.id);

    expect(getProject(project.id)?.axes[0].options).toEqual([]);
    expect(getProject(project.id)?.candidates[0].selections).toEqual({});
  });
});

describe('candidates', () => {
  it('adds a candidate with default scores', () => {
    const project = createProject('Project');
    const candidate = addCandidate(project.id, 'Idea 1');
    expect(candidate.scores).toEqual({ demand: 3, competition: 3, effort: 3, differentiation: 3 });
    expect(getProject(project.id)?.candidates).toEqual([candidate]);
  });

  it('renames a candidate', () => {
    const project = createProject('Project');
    const candidate = addCandidate(project.id, 'Idea 1');
    renameCandidate(project.id, candidate.id, 'Better name');
    expect(getProject(project.id)?.candidates[0].name).toBe('Better name');
  });

  it('deletes a candidate', () => {
    const project = createProject('Project');
    const candidate = addCandidate(project.id, 'Idea 1');
    deleteCandidate(project.id, candidate.id);
    expect(getProject(project.id)?.candidates).toEqual([]);
  });

  it('sets and clears a candidate selection', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');
    const candidate = addCandidate(project.id, 'Idea 1');

    setCandidateSelection(project.id, candidate.id, axis.id, option.id);
    expect(getProject(project.id)?.candidates[0].selections).toEqual({ [axis.id]: option.id });

    setCandidateSelection(project.id, candidate.id, axis.id, null);
    expect(getProject(project.id)?.candidates[0].selections).toEqual({});
  });

  it('updates a single score field without affecting the others', () => {
    const project = createProject('Project');
    const candidate = addCandidate(project.id, 'Idea 1');
    setCandidateScore(project.id, candidate.id, 'demand', 5);
    expect(getProject(project.id)?.candidates[0].scores).toEqual({
      demand: 5,
      competition: 3,
      effort: 3,
      differentiation: 3,
    });
  });

  it('updates notes', () => {
    const project = createProject('Project');
    const candidate = addCandidate(project.id, 'Idea 1');
    setCandidateNotes(project.id, candidate.id, 'Low effort, high margin');
    expect(getProject(project.id)?.candidates[0].notes).toBe('Low effort, high margin');
  });
});

describe('computeScore', () => {
  it('adds demand and differentiation, subtracts competition and effort', () => {
    expect(computeScore({ demand: 5, competition: 1, effort: 2, differentiation: 4 })).toBe(6);
  });

  it('returns 0 for balanced default scores', () => {
    expect(computeScore({ demand: 3, competition: 3, effort: 3, differentiation: 3 })).toBe(0);
  });
});
