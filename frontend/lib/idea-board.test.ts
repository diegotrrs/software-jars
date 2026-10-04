import { beforeEach, describe, expect, it } from 'vitest';
import {
  addCategory,
  addColumn,
  addSticker,
  createBoard,
  deleteBoard,
  deleteCategory,
  deleteColumn,
  deleteSticker,
  getBoard,
  moveSticker,
  recolorCategory,
  renameBoard,
  renameCategory,
  renameColumn,
  reorderColumns,
  resetIdeaBoardStoreForTests,
  setStickerCategory,
  updateStickerText,
} from './idea-board';

beforeEach(() => {
  resetIdeaBoardStoreForTests();
});

describe('boards', () => {
  it('creates a board and can retrieve it', () => {
    const board = createBoard('Trip planning');
    expect(getBoard(board.id)).toEqual(board);
    expect(board.columns).toEqual([]);
    expect(board.categories).toEqual([]);
  });

  it('renames a board', () => {
    const board = createBoard('Untitled board');
    renameBoard(board.id, 'Renamed');
    expect(getBoard(board.id)?.name).toBe('Renamed');
  });

  it('deletes a board', () => {
    const board = createBoard('Temp');
    deleteBoard(board.id);
    expect(getBoard(board.id)).toBeUndefined();
  });

  it('does not affect other boards when mutating one', () => {
    const a = createBoard('A');
    const b = createBoard('B');
    renameBoard(a.id, 'A renamed');
    expect(getBoard(b.id)?.name).toBe('B');
  });
});

describe('columns', () => {
  it('adds a column to a board', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    expect(getBoard(board.id)?.columns).toEqual([column]);
  });

  it('renames a column', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    renameColumn(board.id, column.id, 'Doing');
    expect(getBoard(board.id)?.columns[0].title).toBe('Doing');
  });

  it('deletes a column and its stickers', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    addSticker(board.id, column.id, 'idea');
    deleteColumn(board.id, column.id);
    expect(getBoard(board.id)?.columns).toEqual([]);
  });

  it('reorders columns', () => {
    const board = createBoard('Board');
    const a = addColumn(board.id, 'A');
    const b = addColumn(board.id, 'B');
    const c = addColumn(board.id, 'C');
    reorderColumns(board.id, [c.id, a.id, b.id]);
    expect(getBoard(board.id)?.columns.map((col) => col.id)).toEqual([c.id, a.id, b.id]);
  });
});

describe('stickers', () => {
  it('adds a blank sticker to a column with a rotation within -4..4 degrees', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    const sticker = addSticker(board.id, column.id);
    expect(sticker.text).toBe('');
    expect(sticker.rotation).toBeGreaterThanOrEqual(-4);
    expect(sticker.rotation).toBeLessThanOrEqual(4);
    expect(sticker.categoryId).toBeNull();
    expect(getBoard(board.id)?.columns[0].stickers).toEqual([sticker]);
  });

  it('updates sticker text', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    const sticker = addSticker(board.id, column.id);
    updateStickerText(board.id, column.id, sticker.id, 'Ship the feature');
    expect(getBoard(board.id)?.columns[0].stickers[0].text).toBe('Ship the feature');
  });

  it('deletes a sticker', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    const sticker = addSticker(board.id, column.id);
    deleteSticker(board.id, column.id, sticker.id);
    expect(getBoard(board.id)?.columns[0].stickers).toEqual([]);
  });

  it('reorders a sticker within the same column', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    const s1 = addSticker(board.id, column.id, 'first');
    const s2 = addSticker(board.id, column.id, 'second');
    const s3 = addSticker(board.id, column.id, 'third');
    moveSticker(board.id, s1.id, column.id, column.id, 2);
    expect(getBoard(board.id)?.columns[0].stickers.map((s) => s.id)).toEqual([s2.id, s3.id, s1.id]);
  });

  it('moves a sticker to a different column', () => {
    const board = createBoard('Board');
    const todo = addColumn(board.id, 'To do');
    const done = addColumn(board.id, 'Done');
    const sticker = addSticker(board.id, todo.id, 'idea');
    moveSticker(board.id, sticker.id, todo.id, done.id, 0);

    const updated = getBoard(board.id)!;
    expect(updated.columns.find((c) => c.id === todo.id)?.stickers).toEqual([]);
    expect(updated.columns.find((c) => c.id === done.id)?.stickers).toEqual([sticker]);
  });

  it('does nothing if the sticker no longer exists', () => {
    const board = createBoard('Board');
    const column = addColumn(board.id, 'To do');
    moveSticker(board.id, 'missing-id', column.id, column.id, 0);
    expect(getBoard(board.id)?.columns[0].stickers).toEqual([]);
  });
});

describe('categories', () => {
  it('adds a category with a blank name and a color, cycling through the palette', () => {
    const board = createBoard('Board');
    const a = addCategory(board.id);
    const b = addCategory(board.id);
    expect(a.name).toBe('');
    expect(a.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(b.color).not.toBe(a.color);
    expect(getBoard(board.id)?.categories).toEqual([a, b]);
  });

  it('renames a category', () => {
    const board = createBoard('Board');
    const category = addCategory(board.id);
    renameCategory(board.id, category.id, 'Urgent');
    expect(getBoard(board.id)?.categories[0].name).toBe('Urgent');
  });

  it('recolors a category', () => {
    const board = createBoard('Board');
    const category = addCategory(board.id);
    recolorCategory(board.id, category.id, '#000000');
    expect(getBoard(board.id)?.categories[0].color).toBe('#000000');
  });

  it('deletes a category and clears it from any sticker that had it selected', () => {
    const board = createBoard('Board');
    const category = addCategory(board.id);
    const column = addColumn(board.id, 'To do');
    const sticker = addSticker(board.id, column.id);
    setStickerCategory(board.id, column.id, sticker.id, category.id);

    deleteCategory(board.id, category.id);

    expect(getBoard(board.id)?.categories).toEqual([]);
    expect(getBoard(board.id)?.columns[0].stickers[0].categoryId).toBeNull();
  });

  it('sets and clears a sticker category', () => {
    const board = createBoard('Board');
    const category = addCategory(board.id);
    const column = addColumn(board.id, 'To do');
    const sticker = addSticker(board.id, column.id);

    setStickerCategory(board.id, column.id, sticker.id, category.id);
    expect(getBoard(board.id)?.columns[0].stickers[0].categoryId).toBe(category.id);

    setStickerCategory(board.id, column.id, sticker.id, null);
    expect(getBoard(board.id)?.columns[0].stickers[0].categoryId).toBeNull();
  });

  // Regression: boards saved before this feature shipped have no
  // `categories` field at all in their persisted localStorage JSON (not
  // even an empty array) — reading `.find`/`.map` off that `undefined`
  // used to throw instead of treating it as "no categories yet".
  it('treats a board with no categories field (pre-feature localStorage data) as having none', () => {
    const board = createBoard('Board');
    const legacyState = { boards: [{ id: board.id, name: board.name, columns: [] }] };
    resetIdeaBoardStoreForTests();
    window.localStorage.setItem('software-jars:idea-board', JSON.stringify(legacyState));

    expect(() => addCategory(board.id)).not.toThrow();
    expect(getBoard(board.id)?.categories).toHaveLength(1);
  });
});
