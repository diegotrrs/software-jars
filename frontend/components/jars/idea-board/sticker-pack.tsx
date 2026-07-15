'use client';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { useTranslations } from 'next-intl';

export const PACK_DRAG_ID = 'pack';

// The "infinite pack" — a fixed drag source that never depletes. Dropping it
// on a column spawns a brand-new sticker there; the pack itself never moves.
export const StickerPack = () => {
  const t = useTranslations('ideaBoard');
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: PACK_DRAG_ID });

  return (
    <div className='flex w-28 shrink-0 flex-col items-center gap-3 border-r bg-muted/30 px-3 py-6'>
      <div
        ref={setNodeRef}
        data-testid='sticker-pack'
        className={cn(
          'relative h-20 w-16 cursor-grab touch-none active:cursor-grabbing',
          isDragging && 'opacity-50'
        )}
        {...attributes}
        {...listeners}
      >
        <div className='absolute inset-0 translate-x-1 translate-y-1 rotate-3 rounded-sm bg-[hsl(50_95%_55%)] shadow' />
        <div className='absolute inset-0 -translate-x-0.5 translate-y-0.5 -rotate-2 rounded-sm bg-[hsl(50_95%_58%)] shadow' />
        <div className='absolute inset-0 rounded-sm bg-[hsl(50_95%_62%)] shadow-md' />
      </div>
      <p className='text-center text-xs text-muted-foreground'>{t('pack')}</p>
    </div>
  );
};
