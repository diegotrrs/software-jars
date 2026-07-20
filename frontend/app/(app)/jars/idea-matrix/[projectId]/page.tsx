'use client';
import { ProjectView } from '@/components/jars/idea-matrix/project-view';
import { useParams } from 'next/navigation';

const ProjectPage = () => {
  const params = useParams<{ projectId: string }>();
  return <ProjectView projectId={params.projectId} />;
};

export default ProjectPage;
