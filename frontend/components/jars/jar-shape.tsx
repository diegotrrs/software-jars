import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type JarShapeProps = {
  icon: LucideIcon;
  className?: string;
};

// x-positions for the screw band's vertical grip ridges.
const BAND_RIDGE_X_POSITIONS = [24, 28.5, 33, 37.5, 42, 46.5, 51, 55.5];

export const JarShape = ({ icon: Icon, className }: JarShapeProps) => {
  return (
    <div className={cn('relative h-24 w-20', className)}>
      <svg viewBox='0 0 80 96' className='absolute inset-0 h-full w-full' fill='none'>
        {/* lid dome */}
        <ellipse cx='40' cy='6' rx='14' ry='5' className='fill-muted-foreground/70' />
        <rect x='26' y='6' width='28' height='8' className='fill-muted-foreground/70' />
        <ellipse cx='40' cy='14' rx='14' ry='3' className='fill-muted-foreground/55' />
        <ellipse cx='34' cy='4' rx='3' ry='1.3' className='fill-foreground/25' />

        {/* screw band */}
        <rect x='20' y='13' width='40' height='11' rx='3' className='fill-muted-foreground/45' />
        {BAND_RIDGE_X_POSITIONS.map((x) => (
          <line key={x} x1={x} y1='15.5' x2={x} y2='21.5' className='stroke-foreground/15' strokeWidth='1' />
        ))}

        {/* glass body */}
        <path
          d='M20 24 C14 28 10 32 10 38 L10 80 Q10 94 24 94 L56 94 Q70 94 70 80 L70 38 C70 32 66 28 60 24 Z'
          className='fill-jar-glass stroke-foreground/25'
          strokeWidth='2'
        />

        {/* glass shine */}
        <rect x='20' y='40' width='6' height='38' rx='3' className='fill-foreground/10' transform='rotate(-6 23 59)' />
        <rect x='30' y='40' width='2.5' height='32' rx='1.2' className='fill-foreground/5' transform='rotate(-6 31 56)' />

        {/* grounding shadow */}
        <ellipse cx='40' cy='95' rx='20' ry='1.6' className='fill-foreground/10' />
      </svg>
      <Icon className='absolute left-1/2 top-[66%] h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-foreground' />
    </div>
  );
};
