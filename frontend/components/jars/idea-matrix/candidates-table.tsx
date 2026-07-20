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
    <div className='overflow-x-auto rounded-lg border'>
      <table className='w-full text-sm' data-testid='candidates-table'>
        <thead>
          <tr className='border-b bg-muted/50 text-left'>
            <th className='px-2 py-2 font-medium'>#</th>
            <th className='min-w-40 px-2 py-2 font-medium'>{t('candidateName')}</th>
            {axes.map((axis) => (
              <th key={axis.id} className='min-w-32 px-2 py-2 font-medium'>
                {axis.name || t('untitledAxis')}
              </th>
            ))}
            {SCORE_FIELDS.map((field) => (
              <th key={field} className='px-2 py-2 font-medium'>
                {t(field)}
              </th>
            ))}
            <th className='min-w-16 px-2 py-2 font-medium'>{t('score')}</th>
            <th className='min-w-40 px-2 py-2 font-medium'>{t('notes')}</th>
            <th className='px-2 py-2' />
          </tr>
        </thead>
        <tbody>
          {ranked.map((candidate, index) => (
            <tr key={candidate.id} className='border-b last:border-0' data-testid='candidate-row'>
              <td className='px-2 py-1 text-muted-foreground'>{index + 1}</td>
              <td className='px-2 py-1'>
                <EditableText
                  value={candidate.name}
                  onSave={(name) => onRename(candidate.id, name)}
                  placeholder={t('untitledCandidate')}
                  autoFocus={candidate.id === newestCandidateId}
                  testId='candidate-name'
                />
              </td>
              {axes.map((axis) => (
                <td key={axis.id} className='px-2 py-1'>
                  <select
                    value={candidate.selections[axis.id] ?? ''}
                    onChange={(e) => onSelectOption(candidate.id, axis.id, e.target.value)}
                    data-testid='candidate-axis-select'
                    className='w-full rounded border border-input bg-background px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-ring'
                  >
                    <option value=''>{t('pickOption')}</option>
                    {axis.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
              {SCORE_FIELDS.map((field) => (
                <td key={field} className='px-2 py-1'>
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
                </td>
              ))}
              <td className='px-2 py-1 text-center font-medium' data-testid='candidate-score'>
                {computeScore(candidate.scores)}
              </td>
              <td className='px-2 py-1'>
                <EditableText
                  value={candidate.notes}
                  onSave={(notes) => onNotesChange(candidate.id, notes)}
                  placeholder={t('notesPlaceholder')}
                  multiline
                  testId='candidate-notes'
                />
              </td>
              <td className='px-2 py-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onDelete(candidate.id)}
                  aria-label={t('deleteCandidate')}
                  data-testid='delete-candidate'
                >
                  <X className='h-4 w-4' />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
