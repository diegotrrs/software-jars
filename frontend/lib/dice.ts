export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

export const MIN_DICE_COUNT = 1;
export const MAX_DICE_COUNT = 10;

export const rollDie = (sides: DieSides): number =>
  Math.floor(Math.random() * sides) + 1;

export const rollDice = (count: number, sides: DieSides): number[] =>
  Array.from({ length: count }, () => rollDie(sides));
