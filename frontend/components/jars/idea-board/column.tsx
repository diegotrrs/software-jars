'use client';
import { EditableText } from '@/components/jars/idea-board/editable-text';
import { Sticker } from '@/components/jars/idea-board/sticker';
import { Button } from '@/components/ui/button';
import type { Column as ColumnType } from '@/lib/idea-board';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const columnDragId = (columnId: string) => `col:${columnId}`;
export const columnBodyDropId = (columnId: string) => `body:${columnId}`;

type ColumnProps = {
  column: ColumnType;
  autoFocusTitle?: boolean;
  newestStickerId: string | null;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddSticker: () => void;
  onStickerTextChange: (stickerId: string, text: string) => void;
  onStickerDelete: (stickerId: string) => void;
};

export const Column = ({
  column,
  autoFocusTitle,
  newestStickerId,
  onRename,
  onDelete,
  onAddSticker,
  onStickerTextChange,
  onStickerDelete,
}: ColumnProps) => {
  const t = useTranslations('ideaBoard');

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnDragId(column.id) });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: columnBodyDropId(column.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      data-testid='column'
      className={cn('flex h-full w-64 shrink-0 flex-col rounded-lg border bg-background', isDragging && 'opacity-50')}
    >
      <div className='flex shrink-0 items-center gap-1 border-b p-2'>
        <span
          {...attributes}
          {...listeners}
          className='cursor-grab touch-none text-muted-foreground active:cursor-grabbing'
        >
          <GripVertical className='h-4 w-4' />
        </span>
        <EditableText
          value={column.title}
          onSave={onRename}
          placeholder={t('untitledColumn')}
          autoFocus={autoFocusTitle}
          className='flex-1 font-medium'
          testId='column-title'
        />
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={onDelete}
          aria-label={t('deleteColumn')}
          data-testid='delete-column'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>

      <div
        ref={setDroppableRef}
        data-testid='column-body'
        className={cn(
          // min-h-0 overrides the flex default of min-height:auto, which would
          // otherwise let this box keep growing with content instead of
          // clipping + scrolling within the column's fixed h-full height.
          'flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto p-3',
          isOver && 'bg-accent/40'
        )}
      >
        {column.stickers.map((sticker) => (
          <Sticker
            key={sticker.id}
            id={sticker.id}
            text={sticker.text}
            rotation={sticker.rotation}
            autoFocus={sticker.id === newestStickerId}
            onTextChange={(text) => onStickerTextChange(sticker.id, text)}
            onDelete={() => onStickerDelete(sticker.id)}
          />
        ))}
      </div>

      <Button
        variant='ghost'
        size='sm'
        className='m-2 mt-0 shrink-0 justify-start gap-1 text-muted-foreground'
        onClick={onAddSticker}
        data-testid='add-sticker'
      >
        <Plus className='h-4 w-4' /> {t('addSticker')}
      </Button>
    </div>
  );
};
