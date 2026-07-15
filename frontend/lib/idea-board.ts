const STORAGE_KEY = 'software-jars:idea-board';

export type Sticker = {
  id: string;
  text: string;
  rotation: number;
};

export type Column = {
  id: string;
  title: string;
  stickers: Sticker[];
};

export type Board = {
  id: string;
  name: string;
  columns: Column[];
};

type IdeaBoardState = {
  boards: Board[];
};

const EMPTY_STATE: IdeaBoardState = { boards: [] };

const listeners = new Set<() => void>();
let cachedState: IdeaBoardState | null = null;

const readFromStorage = (): IdeaBoardState => {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IdeaBoardState) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
};

const emit = () => listeners.forEach((listener) => listener());

const writeState = (state: IdeaBoardState): void => {
  cachedState = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emit();
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = (): IdeaBoardState => {
  if (cachedState === null) cachedState = readFromStorage();
  return cachedState;
};

export const getServerSnapshot = (): IdeaBoardState => EMPTY_STATE;

// Only for tests — clears the module-level cache + localStorage so each test starts fresh.
export const resetIdeaBoardStoreForTests = (): void => {
  cachedState = null;
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
};

const generateId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const randomStickerRotation = (): number => Math.round((Math.random() * 8 - 4) * 10) / 10;

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
  const board: Board = { id: generateId(), name, columns: [] };
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

export const addSticker = (boardId: string, columnId: string, text = ''): Sticker => {
  const sticker: Sticker = { id: generateId(), text, rotation: randomStickerRotation() };
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
