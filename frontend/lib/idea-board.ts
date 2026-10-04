import { createLocalStorageStore } from '@/lib/local-storage-store';

const STORAGE_KEY = 'software-jars:idea-board';

export type Sticker = {
  id: string;
  text: string;
  rotation: number;
  categoryId: string | null;
};

export type Column = {
  id: string;
  title: string;
  stickers: Sticker[];
};

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Board = {
  id: string;
  name: string;
  columns: Column[];
  categories: Category[];
};

const NEW_CATEGORY_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6', '#ec4899', '#eab308'];

type IdeaBoardState = {
  boards: Board[];
};

const store = createLocalStorageStore<IdeaBoardState>(STORAGE_KEY, { boards: [] }, { syncNamespace: 'idea-board' });

export const subscribe = store.subscribe;
export const getSnapshot = store.getSnapshot;
export const getServerSnapshot = store.getServerSnapshot;
export const resetIdeaBoardStoreForTests = store.resetForTests;
const writeState = store.writeState;

const generateId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const randomStickerRotation = (): number => Math.round((Math.random() * 8 - 4) * 10) / 10;

// Boards saved before categories existed have no `categories` field at all
// in their persisted localStorage JSON — treat a missing field as "none"
// rather than crashing on `.find`/`.map` of undefined.
const getCategories = (board: Board): Category[] => board.categories ?? [];

const updateBoard = (boardId: string, updater: (board: Board) => Board): void => {
  const state = getSnapshot();
  writeState({
    boards: state.boards.map((board) => (board.id === boardId ? updater(board) : board)),
  });
};

export const getBoard = (boardId: string): Board | undefined =>
  getSnapshot().boards.find((board) => board.id === boardId);

export const createBoard = (name: string): Board => {
  const state = getSnapshot();
  const board: Board = { id: generateId(), name, columns: [], categories: [] };
  writeState({ boards: [...state.boards, board] });
  return board;
};

export const renameBoard = (boardId: string, name: string): void => {
  const state = getSnapshot();
  writeState({
    boards: state.boards.map((board) => (board.id === boardId ? { ...board, name } : board)),
  });
};

export const deleteBoard = (boardId: string): void => {
  const state = getSnapshot();
  writeState({ boards: state.boards.filter((board) => board.id !== boardId) });
};

export const addColumn = (boardId: string, title: string): Column => {
  const column: Column = { id: generateId(), title, stickers: [] };
  updateBoard(boardId, (board) => ({ ...board, columns: [...board.columns, column] }));
  return column;
};

export const renameColumn = (boardId: string, columnId: string, title: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    columns: board.columns.map((column) => (column.id === columnId ? { ...column, title } : column)),
  }));
};

export const deleteColumn = (boardId: string, columnId: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    columns: board.columns.filter((column) => column.id !== columnId),
  }));
};

export const reorderColumns = (boardId: string, orderedColumnIds: string[]): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    columns: orderedColumnIds
      .map((id) => board.columns.find((column) => column.id === id))
      .filter((column): column is Column => column !== undefined),
  }));
};

export const addCategory = (boardId: string): Category => {
  const board = getBoard(boardId);
  const existing = board ? getCategories(board) : [];
  const category: Category = {
    id: generateId(),
    name: '',
    color: NEW_CATEGORY_COLORS[existing.length % NEW_CATEGORY_COLORS.length],
  };
  updateBoard(boardId, (b) => ({ ...b, categories: [...getCategories(b), category] }));
  return category;
};

export const renameCategory = (boardId: string, categoryId: string, name: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    categories: getCategories(board).map((c) => (c.id === categoryId ? { ...c, name } : c)),
  }));
};

export const recolorCategory = (boardId: string, categoryId: string, color: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    categories: getCategories(board).map((c) => (c.id === categoryId ? { ...c, color } : c)),
  }));
};

// Also clears this category from any sticker that had it selected, across
// every column, since a sticker referencing a deleted category is meaningless.
export const deleteCategory = (boardId: string, categoryId: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    categories: getCategories(board).filter((c) => c.id !== categoryId),
    columns: board.columns.map((column) => ({
      ...column,
      stickers: column.stickers.map((s) => (s.categoryId === categoryId ? { ...s, categoryId: null } : s)),
    })),
  }));
};

export const setStickerCategory = (
  boardId: string,
  columnId: string,
  stickerId: string,
  categoryId: string | null
): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, stickers: column.stickers.map((s) => (s.id === stickerId ? { ...s, categoryId } : s)) }
        : column
    ),
  }));
};

export const addSticker = (boardId: string, columnId: string, text = ''): Sticker => {
  const sticker: Sticker = { id: generateId(), text, rotation: randomStickerRotation(), categoryId: null };
  updateBoard(boardId, (board) => ({
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, stickers: [...column.stickers, sticker] } : column
    ),
  }));
  return sticker;
};

export const updateStickerText = (boardId: string, columnId: string, stickerId: string, text: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, stickers: column.stickers.map((s) => (s.id === stickerId ? { ...s, text } : s)) }
        : column
    ),
  }));
};

export const deleteSticker = (boardId: string, columnId: string, stickerId: string): void => {
  updateBoard(boardId, (board) => ({
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, stickers: column.stickers.filter((s) => s.id !== stickerId) }
        : column
    ),
  }));
};

// Moves a sticker to `toColumnId` at `toIndex`, whether that's the same column
// (reorder) or a different one (cross-column move) — one function covers both.
export const moveSticker = (
  boardId: string,
  stickerId: string,
  fromColumnId: string,
  toColumnId: string,
  toIndex: number
): void => {
  updateBoard(boardId, (board) => {
    const fromColumn = board.columns.find((column) => column.id === fromColumnId);
    const sticker = fromColumn?.stickers.find((s) => s.id === stickerId);
    if (!sticker) return board;

    if (fromColumnId === toColumnId) {
      const withoutSticker = fromColumn!.stickers.filter((s) => s.id !== stickerId);
      const reordered = [...withoutSticker];
      reordered.splice(toIndex, 0, sticker);
      return {
        ...board,
        columns: board.columns.map((column) =>
          column.id === fromColumnId ? { ...column, stickers: reordered } : column
        ),
      };
    }

    return {
      ...board,
      columns: board.columns.map((column) => {
        if (column.id === fromColumnId) {
          return { ...column, stickers: column.stickers.filter((s) => s.id !== stickerId) };
        }
        if (column.id === toColumnId) {
          const next = [...column.stickers];
          next.splice(toIndex, 0, sticker);
          return { ...column, stickers: next };
        }
        return column;
      }),
    };
  });
};
