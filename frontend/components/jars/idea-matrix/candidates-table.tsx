'use client';
import { EditableText } from '@/components/jars/idea-matrix/editable-text';
import { Button } from '@/components/ui/button';
import { computeScore, type Axis, type Candidate, type Scores } from '@/lib/idea-matrix';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

type CandidatesTableProps = {
  axes: Axis[];
  candidates: Candidate[];
  newestCandidateId?: string | null;
  onRename: (candidateId: string, name: string) => void;
  onDelete: (candidateId: string) => void;
  onSelectOption: (candidateId: string, axisId: string, optionId: string) => void;
  onScoreChange: (candidateId: string, field: keyof Scores, value: number) => void;
  onNotesChange: (candidateId: string, notes: string) => void;
};

const SCORE_FIELDS: (keyof Scores)[] = ['demand', 'competition', 'effort', 'differentiation'];

export const CandidatesTable = ({
  axes,
  candidates,
  newestCandidateId = null,
  onRename,
  onDelete,
  onSelectOption,
  onScoreChange,
  onNotesChange,
}: CandidatesTableProps) => {
  const t = useTranslations('ideaMatrix');
  const ranked = [...candidates].sort((a, b) => computeScore(b.scores) - computeScore(a.scores));

  return (
    <div className='flex flex-col gap-3' data-testid='candidates-table'>
      {ranked.map((candidate, index) => (
        <div key={candidate.id} className='flex flex-col gap-3 rounded-lg border p-3' data-testid='candidate-row'>
          <div className='flex items-center gap-2'>
            <span className='text-xs font-medium text-muted-foreground'>#{index + 1}</span>
            <EditableText
              value={candidate.name}
              onSave={(name) => onRename(candidate.id, name)}
              placeholder={t('untitledCandidate')}
              autoFocus={candidate.id === newestCandidateId}
              className='flex-1 font-medium'
              testId='candidate-name'
            />
            <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold' data-testid='candidate-score'>
              {t('score')}: {computeScore(candidate.scores)}
            </span>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onDelete(candidate.id)}
              aria-label={t('deleteCandidate')}
              data-testid='delete-candidate'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {axes.map((axis) => (
              <label key={axis.id} className='flex flex-col gap-0.5'>
                <span className='text-[11px] text-muted-foreground'>{axis.name || t('untitledAxis')}</span>
                <select
                  value={candidate.selections[axis.id] ?? ''}
                  onChange={(e) => onSelectOption(candidate.id, axis.id, e.target.value)}
                  data-testid='candidate-axis-select'
                  className='w-32 rounded border border-input bg-background px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-ring'
                >
                  <option value=''>{t('pickOption')}</option>
                  {axis.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className='flex flex-wrap gap-2'>
            {SCORE_FIELDS.map((field) => (
              <label key={field} className='flex flex-col gap-0.5'>
                <span className='text-[11px] text-muted-foreground'>{t(field)}</span>
                <select
                  value={candidate.scores[field]}
                  onChange={(e) => onScoreChange(candidate.id, field, Number(e.target.value))}
                  data-testid={`candidate-score-${field}`}
                  className='w-14 rounded border border-input bg-background px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-ring'
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <EditableText
            value={candidate.notes}
            onSave={(notes) => onNotesChange(candidate.id, notes)}
            placeholder={t('notesPlaceholder')}
            multiline
            testId='candidate-notes'
          />
        </div>
      ))}
    </div>
  );
};
