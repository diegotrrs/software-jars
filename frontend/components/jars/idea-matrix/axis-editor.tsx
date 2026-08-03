'use client';
import { EditableText } from '@/components/jars/idea-matrix/editable-text';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Axis } from '@/lib/idea-matrix';
import { Heart, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type AxisEditorProps = {
  axis: Axis;
  autoFocusName?: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddOption: (label: string) => void;
  onRenameOption: (optionId: string, label: string) => void;
  onDeleteOption: (optionId: string) => void;
  onToggleOptionFavorite: (optionId: string) => void;
};

export const AxisEditor = ({
  axis,
  autoFocusName = false,
  onRename,
  onDelete,
  onAddOption,
  onRenameOption,
  onDeleteOption,
  onToggleOptionFavorite,
}: AxisEditorProps) => {
  const t = useTranslations('ideaMatrix');
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const label = draft.trim();
    if (!label) return;
    onAddOption(label);
    setDraft('');
  };

  return (
    <div className='flex w-64 flex-col gap-2 rounded-lg border p-3' data-testid='axis'>
      <div className='flex items-center gap-1'>
        <EditableText
          value={axis.name}
          onSave={onRename}
          placeholder={t('untitledAxis')}
          autoFocus={autoFocusName}
          className='flex-1 font-medium'
          testId='axis-name'
        />
        <Button variant='ghost' size='icon' onClick={onDelete} aria-label={t('deleteAxis')} data-testid='delete-axis'>
          <X className='h-4 w-4' />
        </Button>
      </div>

      <ul className='flex flex-wrap gap-1' data-testid='axis-options'>
        {axis.options.map((option) => (
          <li
            key={option.id}
            className='flex items-center gap-1 rounded-full border bg-accent/50 pl-1 pr-2 text-xs'
            data-testid='axis-option'
          >
            <EditableText
              value={option.label}
              onSave={(label) => onRenameOption(option.id, label)}
              className='px-1 py-0.5'
              inputClassName='w-24 px-1 py-0.5 text-xs'
              testId='axis-option-label'
            />
            <button
              type='button'
              onClick={() => onToggleOptionFavorite(option.id)}
              aria-label={option.favorite ? t('unfavoriteOption') : t('favoriteOption')}
              aria-pressed={option.favorite}
              data-testid='axis-option-favorite'
            >
              <Heart className={cn('h-3 w-3', option.favorite && 'fill-rose-500 text-rose-500')} />
            </button>
            <button
              type='button'
              onClick={() => onDeleteOption(option.id)}
              aria-label={t('deleteOption')}
              data-testid='delete-axis-option'
            >
              <X className='h-3 w-3' />
            </button>
          </li>
        ))}
      </ul>

      <div className='flex gap-1'>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder={t('addOptionPlaceholder')}
          data-testid='new-axis-option'
          className='w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring'
        />
        <Button
          variant='outline'
          size='icon'
          onClick={handleAdd}
          aria-label={t('addOption')}
          data-testid='add-axis-option'
        >
          <Plus className='h-3 w-3' />
        </Button>
      </div>
    </div>
  );
};
