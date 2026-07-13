import { Dices, type LucideIcon } from 'lucide-react';

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
];
