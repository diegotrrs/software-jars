'use client';
import { Button } from '@/components/ui/button';
import { createProject, deleteProject } from '@/lib/idea-matrix';
import { useIdeaMatrixProjects } from '@/lib/use-idea-matrix';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const ProjectsList = () => {
  const t = useTranslations('ideaMatrix');
  const router = useRouter();
  const projects = useIdeaMatrixProjects();

  const handleCreate = () => {
    // Empty name — the project view shows the "Untitled project" placeholder
    // and auto-focuses the title for editing when the name is still blank.
    const project = createProject('');
    router.push(`/jars/idea-matrix/${project.id}`);
  };

  const handleDelete = (projectId: string, name: string) => {
    const confirmed = window.confirm(t('deleteProjectConfirm', { name: name || t('untitledProject') }));
    if (!confirmed) return;
    deleteProject(projectId);
  };

  return (
    <div className='px-6 pb-6'>
      <Button onClick={handleCreate} className='gap-1' data-testid='new-project'>
        <Plus className='h-4 w-4' /> {t('newProject')}
      </Button>

      {projects.length === 0 ? (
        <p className='mt-6 text-sm text-muted-foreground'>{t('noProjects')}</p>
      ) : (
        <ul className='mt-6 flex flex-col gap-2' data-testid='projects-list'>
          {projects.map((project) => (
            <li key={project.id} className='flex items-center gap-2 rounded-lg border p-3' data-testid='project-item'>
              <Link
                href={`/jars/idea-matrix/${project.id}`}
                className='flex-1 font-medium hover:underline'
                data-testid='project-link'
              >
                {project.name || t('untitledProject')}
              </Link>
              <span className='text-xs text-muted-foreground'>{t('axisCount', { count: project.axes.length })}</span>
              <span className='text-xs text-muted-foreground'>
                {t('candidateCount', { count: project.candidates.length })}
              </span>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => handleDelete(project.id, project.name)}
                aria-label={t('deleteProject')}
                data-testid='delete-project-item'
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
