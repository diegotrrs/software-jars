'use client';
import { CategoryManager } from '@/components/jars/idea-board/category-manager';
import type { Category } from '@/lib/idea-board';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { useTranslations } from 'next-intl';

export const PACK_DRAG_ID = 'pack';

type StickerPackProps = {
  categories: Category[];
  newestCategoryId: string | null;
  onAddCategory: () => void;
  onRenameCategory: (categoryId: string, name: string) => void;
  onRecolorCategory: (categoryId: string, color: string) => void;
  onDeleteCategory: (categoryId: string) => void;
};

// The "infinite pack" — a fixed drag source that never depletes. Dropping it
// on a column spawns a brand-new sticker there; the pack itself never moves.
// A horizontal bar pinned below the columns — categories get the full board
// width to wrap into (rather than being squeezed into a narrow sidebar
// column, which used to clip longer category names). Hidden below md: on
// narrow/mobile viewports the per-column "+" button is the mobile path for
// adding a sticker there, same md breakpoint the nav already uses to split
// desktop/mobile.
export const StickerPack = ({
  categories,
  newestCategoryId,
  onAddCategory,
  onRenameCategory,
  onRecolorCategory,
  onDeleteCategory,
}: StickerPackProps) => {
  const t = useTranslations('ideaBoard');
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: PACK_DRAG_ID });

  return (
    <div className='hidden shrink-0 items-center gap-4 border-t bg-muted/30 px-4 py-3 md:flex'>
      <div className='flex shrink-0 items-center gap-3'>
        <div
          ref={setNodeRef}
          data-testid='sticker-pack'
          className={cn(
            'relative h-14 w-11 cursor-grab touch-none active:cursor-grabbing',
            isDragging && 'opacity-50'
          )}
          {...attributes}
          {...listeners}
        >
          <div className='absolute inset-0 translate-x-1 translate-y-1 rotate-3 rounded-sm bg-[hsl(50_95%_55%)] shadow' />
          <div className='absolute inset-0 -translate-x-0.5 translate-y-0.5 -rotate-2 rounded-sm bg-[hsl(50_95%_58%)] shadow' />
          <div className='absolute inset-0 rounded-sm bg-[hsl(50_95%_62%)] shadow-md' />
        </div>
        <p className='w-20 text-xs text-muted-foreground'>{t('pack')}</p>
      </div>

      <div className='h-10 w-px shrink-0 bg-border' />

      <CategoryManager
        categories={categories}
        newestCategoryId={newestCategoryId}
        onAdd={onAddCategory}
        onRename={onRenameCategory}
        onRecolor={onRecolorCategory}
        onDelete={onDeleteCategory}
      />
    </div>
  );
};
