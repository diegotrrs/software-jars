'use client';
import { EditableText } from '@/components/jars/idea-board/editable-text';
import { cn } from '@/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

type StickerProps = {
  id: string;
  text: string;
  rotation: number;
  autoFocus?: boolean;
  onTextChange: (text: string) => void;
  onDelete: () => void;
};

// A sticker is both a drag source (to move it) and a drop target at its own
// position (so dropping another sticker "on" it inserts nearby) — the same
// combined-registration pattern @dnd-kit's own useSortable uses internally,
// just without the extra reorder-while-dragging machinery we don't need here.
export const Sticker = ({ id, text, rotation, autoFocus, onTextChange, onDelete }: StickerProps) => {
  const t = useTranslations('ideaBoard');
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });

  const style: React.CSSProperties = {
    transform: [CSS.Transform.toString(transform), `rotate(${rotation}deg)`].filter(Boolean).join(' '),
  };

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      data-testid='sticker'
      className={cn(
        'group relative w-40 rounded-sm bg-[hsl(50_95%_62%)] p-2 shadow-md',
        isDragging && 'opacity-40',
        isOver && 'ring-2 ring-ring'
      )}
      {...attributes}
      {...listeners}
    >
      <button
        type='button'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={t('deleteSticker')}
        data-testid='delete-sticker'
        className='absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-foreground text-background group-hover:flex group-focus-within:flex'
      >
        <X className='h-3 w-3' />
      </button>
      <EditableText
        value={text}
        onSave={onTextChange}
        placeholder={t('stickerPlaceholder')}
        autoFocus={autoFocus}
        multiline
        className='min-h-16 text-sm text-neutral-900 hover:bg-black/5'
        inputClassName='min-h-16 bg-[hsl(50_95%_68%)] text-neutral-900'
        testId='sticker-text'
      />
    </div>
  );
};
