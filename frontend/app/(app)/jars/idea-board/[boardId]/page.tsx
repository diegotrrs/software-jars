'use client';
import { BoardView } from '@/components/jars/idea-board/board-view';
import { useParams } from 'next/navigation';

const BoardPage = () => {
  const params = useParams<{ boardId: string }>();
  return <BoardView boardId={params.boardId} />;
};

export default BoardPage;
