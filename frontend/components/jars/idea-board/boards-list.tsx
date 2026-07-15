'use client';
import { createBoard, deleteBoard } from '@/lib/idea-board';
import { useIdeaBoards } from '@/lib/use-idea-boards';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const BoardsList = () => {
  const t = useTranslations('ideaBoard');
  const router = useRouter();
  const boards = useIdeaBoards();

  const handleCreate = () => {
    // Empty name — the board view shows the "Untitled board" placeholder and
    // auto-focuses the title for editing when the name is still blank.
    const board = createBoard('');
    router.push(`/jars/idea-board/${board.id}`);
  };

  const handleDelete = (boardId: string, name: string) => {
    const confirmed = window.confirm(t('deleteBoardConfirm', { name: name || t('untitledBoard') }));
    if (!confirmed) return;
    deleteBoard(boardId);
  };

  return (
    <div className='px-6 pb-6'>
      <Button onClick={handleCreate} className='gap-1' data-testid='new-board'>
        <Plus className='h-4 w-4' /> {t('newBoard')}
      </Button>

      {boards.length === 0 ? (
        <p className='mt-6 text-sm text-muted-foreground'>{t('noBoards')}</p>
      ) : (
        <ul className='mt-6 flex flex-col gap-2' data-testid='boards-list'>
          {boards.map((board) => (
            <li key={board.id} className='flex items-center gap-2 rounded-lg border p-3' data-testid='board-item'>
              <Link
                href={`/jars/idea-board/${board.id}`}
                className='flex-1 font-medium hover:underline'
                data-testid='board-link'
              >
                {board.name || t('untitledBoard')}
              </Link>
              <span className='text-xs text-muted-foreground'>
                {t('columnCount', { count: board.columns.length })}
              </span>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => handleDelete(board.id, board.name)}
                aria-label={t('deleteBoard')}
                data-testid='delete-board-item'
              >
                <X className='h-4 w-4' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
