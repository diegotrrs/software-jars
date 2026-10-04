'use client';
import { Column, columnDragId } from '@/components/jars/idea-board/column';
import { EditableText } from '@/components/jars/idea-board/editable-text';
import { PACK_DRAG_ID, StickerPack } from '@/components/jars/idea-board/sticker-pack';
import { Button } from '@/components/ui/button';
import {
  addCategory,
  addColumn,
  addSticker,
  deleteBoard,
  deleteCategory,
  deleteColumn,
  deleteSticker,
  moveSticker,
  recolorCategory,
  renameBoard,
  renameCategory,
  renameColumn,
  setStickerCategory,
  updateStickerText,
  reorderColumns,
} from '@/lib/idea-board';
import { useIdeaBoards } from '@/lib/use-idea-boards';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type BoardViewProps = {
  boardId: string;
};

export const BoardView = ({ boardId }: BoardViewProps) => {
  const t = useTranslations('ideaBoard');
  const router = useRouter();
  const boards = useIdeaBoards();
  const board = boards.find((b) => b.id === boardId);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [newestStickerId, setNewestStickerId] = useState<string | null>(null);
  const [newestColumnId, setNewestColumnId] = useState<string | null>(null);
  const [newestCategoryId, setNewestCategoryId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!board) {
    return (
      <div className='flex flex-col items-start gap-2 p-6'>
        <p className='text-sm text-muted-foreground'>{t('boardNotFound')}</p>
        <Link href='/jars/idea-board' className='text-sm underline'>
          {t('backToBoards')}
        </Link>
      </div>
    );
  }

  const resolveColumnId = (overId: string): string | null => {
    if (overId.startsWith('body:')) return overId.slice('body:'.length);
    if (overId.startsWith('col:')) return overId.slice('col:'.length);
    const owningColumn = board.columns.find((c) => c.stickers.some((s) => s.id === overId));
    return owningColumn?.id ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (activeIdStr.startsWith('col:')) {
      const activeColId = activeIdStr.slice('col:'.length);
      const overColId = overIdStr.startsWith('col:') ? overIdStr.slice('col:'.length) : resolveColumnId(overIdStr);
      if (overColId && overColId !== activeColId) {
        const ids = board.columns.map((c) => c.id);
        const oldIndex = ids.indexOf(activeColId);
        const newIndex = ids.indexOf(overColId);
        if (oldIndex >= 0 && newIndex >= 0) reorderColumns(board.id, arrayMove(ids, oldIndex, newIndex));
      }
      return;
    }

    if (activeIdStr === PACK_DRAG_ID) {
      const targetColumnId = resolveColumnId(overIdStr);
      if (targetColumnId) {
        const sticker = addSticker(board.id, targetColumnId);
        setNewestStickerId(sticker.id);
      }
      return;
    }

    const stickerId = activeIdStr;
    const fromColumn = board.columns.find((c) => c.stickers.some((s) => s.id === stickerId));
    const targetColumnId = resolveColumnId(overIdStr);
    if (!fromColumn || !targetColumnId) return;
    const toColumn = board.columns.find((c) => c.id === targetColumnId);
    if (!toColumn) return;
    const overIndex = toColumn.stickers.findIndex((s) => s.id === overIdStr);
    const toIndex = overIndex >= 0 ? overIndex : toColumn.stickers.length;
    moveSticker(board.id, stickerId, fromColumn.id, targetColumnId, toIndex);
  };

  const activeSticker = activeDragId
    ? board.columns.flatMap((c) => c.stickers).find((s) => s.id === activeDragId)
    : null;

  const handleAddColumn = () => {
    const column = addColumn(board.id, '');
    setNewestColumnId(column.id);
  };

  const handleDeleteBoard = () => {
    const confirmed = window.confirm(t('deleteBoardConfirm', { name: board.name || t('untitledBoard') }));
    if (!confirmed) return;
    deleteBoard(board.id);
    router.push('/jars/idea-board');
  };

  const handleDeleteColumn = (columnId: string, columnTitle: string, stickerCount: number) => {
    if (stickerCount > 0) {
      const confirmed = window.confirm(
        t('deleteColumnConfirm', { title: columnTitle || t('untitledColumn'), count: stickerCount })
      );
      if (!confirmed) return;
    }
    deleteColumn(board.id, columnId);
  };

  const handleAddCategory = () => {
    const category = addCategory(board.id);
    setNewestCategoryId(category.id);
  };

  const categories = board.categories ?? [];

  return (
    <div className='flex h-[calc(100vh-3.5rem)] flex-col'>
      <div className='flex items-center gap-3 border-b px-4 py-2'>
        <Link
          href='/jars/idea-board'
          aria-label={t('backToBoards')}
          className='text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' />
        </Link>
        <EditableText
          value={board.name}
          onSave={(name) => renameBoard(board.id, name)}
          placeholder={t('untitledBoard')}
          autoFocus={board.name === ''}
          className='max-w-xs text-lg font-bold'
          testId='board-name'
        />
        <div className='flex-1' />
        <Button variant='ghost' size='sm' onClick={handleDeleteBoard} data-testid='delete-board'>
          {t('deleteBoard')}
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className='flex flex-1 flex-col overflow-hidden'>
          <div className='flex flex-1 gap-4 overflow-x-auto p-4'>
            <SortableContext items={board.columns.map((c) => columnDragId(c.id))}>
              {board.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  autoFocusTitle={column.id === newestColumnId}
                  newestStickerId={newestStickerId}
                  categories={categories}
                  onRename={(title) => renameColumn(board.id, column.id, title)}
                  onDelete={() => handleDeleteColumn(column.id, column.title, column.stickers.length)}
                  onAddSticker={() => {
                    const sticker = addSticker(board.id, column.id);
                    setNewestStickerId(sticker.id);
                  }}
                  onStickerTextChange={(stickerId, text) => updateStickerText(board.id, column.id, stickerId, text)}
                  onStickerDelete={(stickerId) => deleteSticker(board.id, column.id, stickerId)}
                  onStickerCategoryChange={(stickerId, categoryId) =>
                    setStickerCategory(board.id, column.id, stickerId, categoryId)
                  }
                />
              ))}
            </SortableContext>

            <Button variant='outline' className='h-fit shrink-0 gap-1' onClick={handleAddColumn} data-testid='add-column'>
              <Plus className='h-4 w-4' /> {t('addColumn')}
            </Button>
          </div>

          <StickerPack
            categories={categories}
            newestCategoryId={newestCategoryId}
            onAddCategory={handleAddCategory}
            onRenameCategory={(categoryId, name) => renameCategory(board.id, categoryId, name)}
            onRecolorCategory={(categoryId, color) => recolorCategory(board.id, categoryId, color)}
            onDeleteCategory={(categoryId) => deleteCategory(board.id, categoryId)}
          />
        </div>

        <DragOverlay>
          {activeDragId === PACK_DRAG_ID && (
            <div className='w-40 rounded-sm bg-[hsl(50_95%_62%)] p-2 shadow-lg'>
              <div className='min-h-16 text-sm text-neutral-900'>{t('stickerPlaceholder')}</div>
            </div>
          )}
          {activeSticker && (
            <div className='w-40 rounded-sm bg-[hsl(50_95%_62%)] p-2 shadow-lg'>
              <div className='min-h-16 whitespace-pre-wrap text-sm text-neutral-900'>{activeSticker.text}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
