'use client';
import { AxisEditor } from '@/components/jars/idea-matrix/axis-editor';
import { CandidatesTable } from '@/components/jars/idea-matrix/candidates-table';
import { EditableText } from '@/components/jars/idea-matrix/editable-text';
import { Button } from '@/components/ui/button';
import {
  addAxis,
  addAxisOption,
  addCandidate,
  addRandomCandidate,
  deleteAxis,
  deleteAxisOption,
  deleteCandidate,
  deleteProject,
  renameAxis,
  renameAxisOption,
  renameCandidate,
  renameProject,
  setCandidateNotes,
  setCandidateScore,
  setCandidateSelection,
} from '@/lib/idea-matrix';
import { useIdeaMatrixProjects } from '@/lib/use-idea-matrix';
import { ArrowLeft, Plus, Shuffle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ProjectViewProps = {
  projectId: string;
};

export const ProjectView = ({ projectId }: ProjectViewProps) => {
  const t = useTranslations('ideaMatrix');
  const router = useRouter();
  const projects = useIdeaMatrixProjects();
  const project = projects.find((p) => p.id === projectId);
  const [newestAxisId, setNewestAxisId] = useState<string | null>(null);
  const [newestCandidateId, setNewestCandidateId] = useState<string | null>(null);

  if (!project) {
    return (
      <div className='flex flex-col items-start gap-2 p-6'>
        <p className='text-sm text-muted-foreground'>{t('projectNotFound')}</p>
        <Link href='/jars/idea-matrix' className='text-sm underline'>
          {t('backToProjects')}
        </Link>
      </div>
    );
  }

  const handleDeleteProject = () => {
    const confirmed = window.confirm(t('deleteProjectConfirm', { name: project.name || t('untitledProject') }));
    if (!confirmed) return;
    deleteProject(project.id);
    router.push('/jars/idea-matrix');
  };

  return (
    <div className='flex flex-col gap-6 p-4'>
      <div className='flex items-center gap-3 border-b pb-3'>
        <Link
          href='/jars/idea-matrix'
          aria-label={t('backToProjects')}
          className='text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' />
        </Link>
        <EditableText
          value={project.name}
          onSave={(name) => renameProject(project.id, name)}
          placeholder={t('untitledProject')}
          autoFocus={project.name === ''}
          className='max-w-xs text-lg font-bold'
          testId='project-name'
        />
        <div className='flex-1' />
        <Button variant='ghost' size='sm' onClick={handleDeleteProject} data-testid='delete-project'>
          {t('deleteProject')}
        </Button>
      </div>

      <section className='flex flex-col gap-2'>
        <h2 className='text-sm font-semibold text-muted-foreground'>{t('axesTitle')}</h2>
        <div className='flex flex-wrap items-start gap-3' data-testid='axes-list'>
          {project.axes.map((axis) => (
            <AxisEditor
              key={axis.id}
              axis={axis}
              autoFocusName={axis.id === newestAxisId}
              onRename={(name) => renameAxis(project.id, axis.id, name)}
              onDelete={() => deleteAxis(project.id, axis.id)}
              onAddOption={(label) => addAxisOption(project.id, axis.id, label)}
              onRenameOption={(optionId, label) => renameAxisOption(project.id, axis.id, optionId, label)}
              onDeleteOption={(optionId) => deleteAxisOption(project.id, axis.id, optionId)}
            />
          ))}
          <Button
            variant='outline'
            className='gap-1'
            onClick={() => setNewestAxisId(addAxis(project.id, '').id)}
            data-testid='add-axis'
          >
            <Plus className='h-4 w-4' /> {t('addAxis')}
          </Button>
        </div>
      </section>

      <section className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-muted-foreground'>{t('candidatesTitle')}</h2>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='gap-1'
              onClick={() => setNewestCandidateId(addRandomCandidate(project.id).id)}
              data-testid='add-random-candidate'
            >
              <Shuffle className='h-4 w-4' /> {t('addRandomCandidate')}
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='gap-1'
              onClick={() => setNewestCandidateId(addCandidate(project.id, '').id)}
              data-testid='add-candidate'
            >
              <Plus className='h-4 w-4' /> {t('addCandidate')}
            </Button>
          </div>
        </div>

        {project.candidates.length === 0 ? (
          <p className='text-sm text-muted-foreground'>{t('noCandidates')}</p>
        ) : (
          <CandidatesTable
            axes={project.axes}
            candidates={project.candidates}
            newestCandidateId={newestCandidateId}
            onRename={(candidateId, name) => renameCandidate(project.id, candidateId, name)}
            onDelete={(candidateId) => deleteCandidate(project.id, candidateId)}
            onSelectOption={(candidateId, axisId, optionId) =>
              setCandidateSelection(project.id, candidateId, axisId, optionId || null)
            }
            onScoreChange={(candidateId, field, value) => setCandidateScore(project.id, candidateId, field, value)}
            onNotesChange={(candidateId, notes) => setCandidateNotes(project.id, candidateId, notes)}
          />
        )}
      </section>
    </div>
  );
};
