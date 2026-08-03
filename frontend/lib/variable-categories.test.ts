import { describe, expect, it } from 'vitest';
import { getVariableCategories, searchVariableCategories } from './variable-categories';

describe('getVariableCategories', () => {
  it('returns the English categories for locale "en"', () => {
    const categories = getVariableCategories('en');
    expect(categories.find((c) => c.id === 'sports')?.name).toBe('Sports');
  });

  it('returns the Spanish categories for locale "es"', () => {
    const categories = getVariableCategories('es');
    expect(categories.find((c) => c.id === 'sports')?.name).toBe('Deportes');
  });

  it('falls back to English for an unknown locale', () => {
    const categories = getVariableCategories('fr');
    expect(categories.find((c) => c.id === 'sports')?.name).toBe('Sports');
  });

  it('every category has at least one option', () => {
    for (const category of getVariableCategories('en')) {
      expect(category.options.length).toBeGreaterThan(0);
    }
  });

  it('English and Spanish files have the same category and option ids', () => {
    const en = getVariableCategories('en');
    const es = getVariableCategories('es');
    expect(es.map((c) => c.id).sort()).toEqual(en.map((c) => c.id).sort());

    for (const enCategory of en) {
      const esCategory = es.find((c) => c.id === enCategory.id)!;
      expect(esCategory.options.map((o) => o.id).sort()).toEqual(enCategory.options.map((o) => o.id).sort());
    }
  });
});

describe('searchVariableCategories', () => {
  it('returns every category when the query is empty', () => {
    expect(searchVariableCategories('en', '')).toEqual(getVariableCategories('en'));
  });

  it('matches a category by its own name, case-insensitively', () => {
    const results = searchVariableCategories('en', 'sPoRtS');
    expect(results.map((c) => c.id)).toContain('sports');
  });

  it('matches a category by an option label, even if the category name does not match', () => {
    const results = searchVariableCategories('en', 'tennis');
    expect(results.map((c) => c.id)).toEqual(['sports']);
  });

  it('returns no results for a query matching nothing', () => {
    expect(searchVariableCategories('en', 'xyzxyz')).toEqual([]);
  });
});
