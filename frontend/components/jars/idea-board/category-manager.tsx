'use client';
import type { Category } from '@/lib/idea-board';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

type CategoryManagerProps = {
  categories: Category[];
  newestCategoryId: string | null;
  onAdd: () => void;
  onRename: (categoryId: string, name: string) => void;
  onRecolor: (categoryId: string, color: string) => void;
  onDelete: (categoryId: string) => void;
};

export const CategoryManager = ({
  categories,
  newestCategoryId,
  onAdd,
  onRename,
  onRecolor,
  onDelete,
}: CategoryManagerProps) => {
  const t = useTranslations('ideaBoard');

  return (
    <div className='flex min-w-0 flex-1 items-center gap-2' data-testid='category-manager'>
      <p className='shrink-0 text-xs font-medium text-muted-foreground'>{t('categoriesTitle')}</p>
      <div className='flex flex-1 flex-wrap items-center gap-1'>
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            autoFocus={category.id === newestCategoryId}
            onRename={(name) => onRename(category.id, name)}
            onRecolor={(color) => onRecolor(category.id, color)}
            onDelete={() => onDelete(category.id)}
          />
        ))}
        <button
          type='button'
          onClick={onAdd}
          data-testid='add-category'
          className='shrink-0 rounded-full border border-dashed px-2 py-1 text-xs text-muted-foreground hover:bg-accent'
        >
          {t('addNewCategory')}
        </button>
      </div>
    </div>
  );
};

const CategoryRow = ({
  category,
  autoFocus,
  onRename,
  onRecolor,
  onDelete,
}: {
  category: Category;
  autoFocus: boolean;
  onRename: (name: string) => void;
  onRecolor: (color: string) => void;
  onDelete: () => void;
}) => {
  const t = useTranslations('ideaBoard');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [autoFocus]);

  return (
    <div
      className='group flex shrink-0 items-center gap-1 rounded-full border bg-accent/30 py-0.5 pl-1 pr-2'
      data-testid='category-row'
    >
      <input
        type='color'
        value={category.color}
        onChange={(e) => onRecolor(e.target.value)}
        aria-label={t('categoryColorLabel', { name: category.name || t('untitledCategory') })}
        data-testid='category-color-input'
        className='h-5 w-5 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0'
      />
      <input
        ref={inputRef}
        value={category.name}
        onChange={(e) => onRename(e.target.value)}
        placeholder={t('newCategoryPlaceholder')}
        data-testid='category-name-input'
        className='w-36 bg-transparent text-xs outline-none placeholder:text-muted-foreground'
      />
      <button
        type='button'
        onClick={onDelete}
        aria-label={t('deleteCategory', { name: category.name || t('untitledCategory') })}
        data-testid='delete-category'
        className='shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100'
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  );
};
