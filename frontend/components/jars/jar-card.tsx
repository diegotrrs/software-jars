import { JarShape } from '@/components/jars/jar-shape';
import type { Jar } from '@/lib/jars';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const JarCard = ({ jar }: { jar: Jar }) => {
  const t = useTranslations();

  return (
    <Link
      href={jar.href}
      data-testid={jar.testId}
      className='flex flex-col items-center gap-2 rounded-lg p-4 text-center transition-colors hover:bg-accent'
    >
      <JarShape icon={jar.icon} />
      <span className='text-sm font-medium'>{t(jar.nameKey)}</span>
      <span className='text-xs text-muted-foreground'>{t(jar.descriptionKey)}</span>
    </Link>
  );
};
