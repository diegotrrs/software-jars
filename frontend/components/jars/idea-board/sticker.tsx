'use client';
import { EditableText } from '@/components/jars/idea-board/editable-text';
import type { Category } from '@/lib/idea-board';
import { cn } from '@/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Palette, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type StickerProps = {
  id: string;
  text: string;
  rotation: number;
  autoFocus?: boolean;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  categories: Category[];
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
};

const DEFAULT_COLOR = 'hsl(50 95% 62%)';

// A sticker is both a drag source (to move it) and a drop target at its own
// position (so dropping another sticker "on" it inserts nearby) — the same
// combined-registration pattern @dnd-kit's own useSortable uses internally,
// just without the extra reorder-while-dragging machinery we don't need here.
export const Sticker = ({
  id,
  text,
  rotation,
  autoFocus,
  onTextChange,
  onDelete,
  categories,
  categoryId,
  onCategoryChange,
}: StickerProps) => {
  const t = useTranslations('ideaBoard');
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;

  // The category IS the card's color — no corner dot/indicator. A
  // hover-revealed palette button (same reveal spot/pattern the delete
  // button already uses) opens the picker to assign/change/clear it.
  const style: React.CSSProperties = {
    transform: [CSS.Transform.toString(transform), `rotate(${rotation}deg)`].filter(Boolean).join(' '),
    backgroundColor: activeCategory?.color ?? DEFAULT_COLOR,
  };

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      data-testid='sticker'
      className={cn('group relative w-40 rounded-sm p-2 shadow-md', isDragging && 'opacity-40', isOver && 'ring-2 ring-ring')}
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

      <div className='absolute -left-1.5 -top-1.5'>
        <button
          type='button'
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setCategoryMenuOpen((open) => !open);
          }}
          aria-label={t('changeCategory')}
          data-testid='sticker-category-badge'
          className='hidden h-5 w-5 items-center justify-center rounded-full bg-foreground text-background group-hover:flex group-focus-within:flex'
        >
          <Palette className='h-3 w-3' />
        </button>
        {categoryMenuOpen && (
          <div
            data-testid='sticker-category-dropdown'
            className='absolute left-0 top-6 z-20 w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-md'
          >
            <button
              type='button'
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onCategoryChange(null);
                setCategoryMenuOpen(false);
              }}
              data-testid='sticker-category-option'
              className='flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-accent'
            >
              <span className='h-3 w-3 rounded-full border border-dashed border-muted-foreground' />
              {t('noCategory')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type='button'
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryChange(category.id);
                  setCategoryMenuOpen(false);
                }}
                data-testid='sticker-category-option'
                className='flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-accent'
              >
                <span className='h-3 w-3 rounded-full' style={{ backgroundColor: category.color }} />
                {category.name || t('untitledCategory')}
              </button>
            ))}
          </div>
        )}
      </div>

      <EditableText
        value={text}
        onSave={onTextChange}
        placeholder={t('stickerPlaceholder')}
        autoFocus={autoFocus}
        multiline
        className='min-h-16 text-sm text-neutral-900 hover:bg-black/5'
        inputClassName='min-h-16 bg-white/40 text-neutral-900'
        testId='sticker-text'
      />
    </div>
  );
};
