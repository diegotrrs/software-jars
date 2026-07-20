'use client';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type EditableTextProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  testId?: string;
};

export const EditableText = ({
  value,
  onSave,
  placeholder,
  autoFocus = false,
  multiline = false,
  className,
  inputClassName,
  testId,
}: EditableTextProps) => {
  const [editing, setEditing] = useState(autoFocus);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
    if (trimmed === '') setDraft(value);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const sharedProps = {
      ref: inputRef as never,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      placeholder,
      'data-testid': testId,
      className: cn(
        'w-full resize-none rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring',
        inputClassName
      ),
    };

    if (multiline) {
      return (
        <textarea
          {...sharedProps}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
          }}
        />
      );
    }

    return (
      <input
        {...sharedProps}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
          if (e.key === 'Enter') commit();
        }}
      />
    );
  }

  return (
    <button
      type='button'
      onClick={() => setEditing(true)}
      data-testid={testId}
      className={cn(
        'block w-full cursor-text rounded px-2 py-1 text-left hover:bg-accent/50',
        multiline ? 'whitespace-pre-wrap break-words' : 'truncate',
        className
      )}
    >
      {value || <span className='text-muted-foreground'>{placeholder}</span>}
    </button>
  );
};
