'use client';
import { searchVariableCategories, type VariableCategory } from '@/lib/variable-categories';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

type CategorySearchProps = {
  onAddCategory: (category: VariableCategory) => void;
};

export const CategorySearch = ({ onAddCategory }: CategorySearchProps) => {
  const t = useTranslations('ideaMatrix');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addedCategoryName, setAddedCategoryName] = useState<string | null>(null);
  const results = searchVariableCategories(locale, query);
  const expanded = results.find((c) => c.id === expandedId) ?? null;

  const handleAdd = (category: VariableCategory) => {
    onAddCategory(category);
    setExpandedId(null);
    setAddedCategoryName(category.name);
    setTimeout(() => setAddedCategoryName(null), 2000);
  };

  return (
    <div className='flex flex-col gap-2 rounded-lg border p-3' data-testid='category-search'>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('categorySearchPlaceholder')}
        data-testid='category-search-input'
        className='w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring'
      />
      <ul className='flex flex-wrap gap-1' data-testid='category-search-results'>
        {results.length === 0 && <li className='text-xs text-muted-foreground'>{t('categorySearchNoResults')}</li>}
        {results.map((category) => (
          <li key={category.id}>
            <button
              type='button'
              onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}
              data-testid='category-chip'
              aria-expanded={expandedId === category.id}
              className={`rounded-full border px-3 py-1 text-xs hover:bg-accent ${
                expandedId === category.id ? 'bg-accent' : 'bg-accent/50'
              }`}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>

      {expanded && (
        <div
          className='flex flex-col gap-2 rounded-md border bg-muted/30 p-3 animate-in fade-in-0 slide-in-from-top-1'
          data-testid='category-preview'
        >
          <div className='flex flex-wrap gap-1' data-testid='category-preview-options'>
            {expanded.options.map((option) => (
              <span
                key={option.id}
                data-testid='category-preview-option'
                className='rounded-full border bg-background px-2 py-0.5 text-xs'
              >
                {option.label}
              </span>
            ))}
          </div>
          <button
            type='button'
            onClick={() => handleAdd(expanded)}
            data-testid='category-add-button'
            className='self-start rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:opacity-90'
          >
            {t('addCategoryConfirm', { name: expanded.name, count: expanded.options.length })}
          </button>
        </div>
      )}

      {addedCategoryName && (
        <div
          role='status'
          data-testid='category-added-toast'
          className='fixed top-28 right-4 z-50 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95'
        >
          {t('categoryAddedToast', { name: addedCategoryName })}
        </div>
      )}
    </div>
  );
};
