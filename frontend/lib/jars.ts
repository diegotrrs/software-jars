import { Dices, Grid3x3, StickyNote, type LucideIcon } from 'lucide-react';

export type Jar = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  href: string;
  icon: LucideIcon;
  testId: string;
};

export const jars: Jar[] = [
  {
    id: 'dice-roller',
    nameKey: 'jars.diceRoller.name',
    descriptionKey: 'jars.diceRoller.description',
    href: '/jars/dice-roller',
    icon: Dices,
    testId: 'jar-dice-roller',
  },
  {
    id: 'idea-board',
    nameKey: 'jars.ideaBoard.name',
    descriptionKey: 'jars.ideaBoard.description',
    href: '/jars/idea-board',
    icon: StickyNote,
    testId: 'jar-idea-board',
  },
  {
    id: 'idea-matrix',
    nameKey: 'jars.ideaMatrix.name',
    descriptionKey: 'jars.ideaMatrix.description',
    href: '/jars/idea-matrix',
    icon: Grid3x3,
    testId: 'jar-idea-matrix',
  },
];
