'use client';
import { cn } from '@/lib/utils';
import type { DieSides } from '@/lib/dice';
import { useEffect, useState } from 'react';

type DiceFaceProps = {
  sides: DieSides;
  finalValue: number | null;
  rolling: boolean;
};

export const DiceFace = ({ sides, finalValue, rolling }: DiceFaceProps) => {
  const [cyclingValue, setCyclingValue] = useState(1);

  useEffect(() => {
    if (!rolling) return;

    const interval = setInterval(() => {
      setCyclingValue(Math.floor(Math.random() * sides) + 1);
    }, 60);

    return () => clearInterval(interval);
  }, [rolling, sides]);

  const display = rolling ? cyclingValue : (finalValue ?? cyclingValue);

  return (
    <div
      data-testid='die-face'
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-lg border-2 border-foreground/20 bg-card text-lg font-bold shadow-sm',
        rolling && 'animate-dice-tumble',
        !rolling && finalValue !== null && 'animate-dice-settle',
      )}
    >
      {display}
    </div>
  );
};
