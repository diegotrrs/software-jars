import { beforeEach, describe, expect, it } from 'vitest';
import {
  addAxis,
  addAxisFromCategory,
  addAxisOption,
  addCandidate,
  addRandomCandidate,
  computeScore,
  createProject,
  deleteAxis,
  deleteAxisOption,
  deleteCandidate,
  deleteProject,
  getProject,
  randomizeCandidateSelections,
  renameAxis,
  renameAxisOption,
  renameCandidate,
  renameProject,
  resetIdeaMatrixStoreForTests,
  setCandidateNotes,
  setCandidateScore,
  setCandidateSelection,
  toggleAxisOptionFavorite,
  toggleCandidateAxisLock,
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

  it('deleting an axis also clears any candidate lock referencing it', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const candidate = addCandidate(project.id, 'Idea 1');
    toggleCandidateAxisLock(project.id, candidate.id, axis.id);

    deleteAxis(project.id, axis.id);

    expect(getProject(project.id)?.candidates[0].lockedAxisIds).toEqual([]);
  });

  it('adds a whole category as a new axis, with fresh ids and unfavorited options', () => {
    const project = createProject('Project');
    const category = {
      id: 'sports',
      name: 'Sports',
      options: [
        { id: 'tennis', label: 'Tennis' },
        { id: 'football', label: 'Football' },
      ],
    };

    const axis = addAxisFromCategory(project.id, category);

    expect(axis.name).toBe('Sports');
    expect(axis.options.map((o) => o.label)).toEqual(['Tennis', 'Football']);
    expect(axis.options.every((o) => o.favorite === false)).toBe(true);
    expect(axis.id).not.toBe(category.id);
    expect(axis.options[0].id).not.toBe(category.options[0].id);
    expect(getProject(project.id)?.axes).toEqual([axis]);
  });

  it('adding the same category twice creates two independent axes', () => {
    const project = createProject('Project');
    const category = { id: 'colors', name: 'Colors', options: [{ id: 'red', label: 'Red' }] };

    const first = addAxisFromCategory(project.id, category);
    const second = addAxisFromCategory(project.id, category);

    expect(first.id).not.toBe(second.id);
    expect(getProject(project.id)?.axes).toEqual([first, second]);
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

  it('adds an option unfavorited by default', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');
    expect(option.favorite).toBe(false);
  });

  it('toggles an option favorite on and off', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const option = addAxisOption(project.id, axis.id, 'Vintage');

    toggleAxisOptionFavorite(project.id, axis.id, option.id);
    expect(getProject(project.id)?.axes[0].options[0].favorite).toBe(true);

    toggleAxisOptionFavorite(project.id, axis.id, option.id);
    expect(getProject(project.id)?.axes[0].options[0].favorite).toBe(false);
  });

  it('toggling one option favorite does not affect other options', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const vintage = addAxisOption(project.id, axis.id, 'Vintage');
    const nerd = addAxisOption(project.id, axis.id, 'Nerd');

    toggleAxisOptionFavorite(project.id, axis.id, vintage.id);

    const options = getProject(project.id)?.axes[0].options ?? [];
    expect(options.find((o) => o.id === vintage.id)?.favorite).toBe(true);
    expect(options.find((o) => o.id === nerd.id)?.favorite).toBe(false);
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

  it('addRandomCandidate picks a valid option for every axis that has options', () => {
    const project = createProject('Project');
    const niche = addAxis(project.id, 'Niche');
    const vintage = addAxisOption(project.id, niche.id, 'Vintage');
    const nerd = addAxisOption(project.id, niche.id, 'Nerd');
    const audience = addAxis(project.id, 'Audience');
    const devs = addAxisOption(project.id, audience.id, 'Devs');

    const candidate = addRandomCandidate(project.id);

    expect(Object.keys(candidate.selections).sort()).toEqual([audience.id, niche.id].sort());
    expect([vintage.id, nerd.id]).toContain(candidate.selections[niche.id]);
    expect(candidate.selections[audience.id]).toBe(devs.id);
  });

  it('addRandomCandidate leaves an axis unselected if it has no options', () => {
    const project = createProject('Project');
    const empty = addAxis(project.id, 'Empty axis');

    const candidate = addRandomCandidate(project.id);

    expect(candidate.selections[empty.id]).toBeUndefined();
  });

  it('addRandomCandidate starts with a blank name, default scores, and empty notes — only selections are randomized', () => {
    const project = createProject('Project');
    const candidate = addRandomCandidate(project.id);

    expect(candidate.name).toBe('');
    expect(candidate.scores).toEqual({ demand: 3, competition: 3, effort: 3, differentiation: 3 });
    expect(candidate.notes).toBe('');
    expect(getProject(project.id)?.candidates).toEqual([candidate]);
  });

  it('a new candidate starts with no locked axes', () => {
    const project = createProject('Project');
    const candidate = addCandidate(project.id, 'Idea 1');
    expect(candidate.lockedAxisIds).toEqual([]);
  });
});

describe('locking and randomizing candidate selections', () => {
  it('toggles a lock on and off', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const candidate = addCandidate(project.id, 'Idea 1');

    toggleCandidateAxisLock(project.id, candidate.id, axis.id);
    expect(getProject(project.id)?.candidates[0].lockedAxisIds).toEqual([axis.id]);

    toggleCandidateAxisLock(project.id, candidate.id, axis.id);
    expect(getProject(project.id)?.candidates[0].lockedAxisIds).toEqual([]);
  });

  it('locking one axis does not affect another', () => {
    const project = createProject('Project');
    const a = addAxis(project.id, 'A');
    const b = addAxis(project.id, 'B');
    const candidate = addCandidate(project.id, 'Idea 1');

    toggleCandidateAxisLock(project.id, candidate.id, a.id);

    expect(getProject(project.id)?.candidates[0].lockedAxisIds).toEqual([a.id]);
    expect(getProject(project.id)?.candidates[0].lockedAxisIds).not.toContain(b.id);
  });

  it('randomizeCandidateSelections leaves a locked axis untouched but re-rolls unlocked ones', () => {
    const project = createProject('Project');
    const niche = addAxis(project.id, 'Niche');
    const vintage = addAxisOption(project.id, niche.id, 'Vintage');
    const audience = addAxis(project.id, 'Audience');
    const devs = addAxisOption(project.id, audience.id, 'Devs');
    const candidate = addCandidate(project.id, 'Idea 1');

    setCandidateSelection(project.id, candidate.id, niche.id, vintage.id);
    toggleCandidateAxisLock(project.id, candidate.id, niche.id);

    randomizeCandidateSelections(project.id, candidate.id);

    const updated = getProject(project.id)?.candidates[0];
    expect(updated?.selections[niche.id]).toBe(vintage.id);
    expect(updated?.selections[audience.id]).toBe(devs.id);
  });

  it('randomizeCandidateSelections leaves an unlocked axis with no options unselected', () => {
    const project = createProject('Project');
    const empty = addAxis(project.id, 'Empty axis');
    const candidate = addCandidate(project.id, 'Idea 1');

    randomizeCandidateSelections(project.id, candidate.id);

    expect(getProject(project.id)?.candidates[0].selections[empty.id]).toBeUndefined();
  });

  // Regression: candidates saved before this feature shipped have no
  // lockedAxisIds in their persisted localStorage JSON at all (not even an
  // empty array) — reading `.includes`/`.filter` off that `undefined` used
  // to throw instead of treating it as "nothing locked".
  it('treats a candidate with no lockedAxisIds field (pre-feature localStorage data) as fully unlocked', () => {
    const project = createProject('Project');
    const axis = addAxis(project.id, 'Niche');
    const vintage = addAxisOption(project.id, axis.id, 'Vintage');
    const candidate = addCandidate(project.id, 'Idea 1');

    // Simulate legacy data: write the project back to localStorage with the
    // candidate's lockedAxisIds field stripped out entirely, then force the
    // store to re-read from localStorage instead of its in-memory cache.
    const legacyState = {
      projects: [
        {
          ...project,
          axes: [{ ...axis, options: [vintage] }],
          candidates: [{ id: candidate.id, name: '', selections: {}, scores: candidate.scores, notes: '' }],
        },
      ],
    };
    resetIdeaMatrixStoreForTests();
    window.localStorage.setItem('software-jars:idea-matrix', JSON.stringify(legacyState));

    expect(() => toggleCandidateAxisLock(project.id, candidate.id, axis.id)).not.toThrow();
    expect(getProject(project.id)?.candidates[0].lockedAxisIds).toEqual([axis.id]);

    expect(() => randomizeCandidateSelections(project.id, candidate.id)).not.toThrow();
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
