import { Binary, Braces, Dices, FileCode, Fingerprint, Globe, Grid3x3, StickyNote, type LucideIcon } from 'lucide-react';

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
  {
    id: 'uuid-generator',
    nameKey: 'jars.uuidGenerator.name',
    descriptionKey: 'jars.uuidGenerator.description',
    href: '/jars/uuid-generator',
    icon: Fingerprint,
    testId: 'jar-uuid-generator',
  },
  {
    id: 'json-formatter',
    nameKey: 'jars.jsonFormatter.name',
    descriptionKey: 'jars.jsonFormatter.description',
    href: '/jars/json-formatter',
    icon: Braces,
    testId: 'jar-json-formatter',
  },
  {
    id: 'base64',
    nameKey: 'jars.base64.name',
    descriptionKey: 'jars.base64.description',
    href: '/jars/base64',
    icon: Binary,
    testId: 'jar-base64',
  },
  {
    id: 'xml-formatter',
    nameKey: 'jars.xmlFormatter.name',
    descriptionKey: 'jars.xmlFormatter.description',
    href: '/jars/xml-formatter',
    icon: FileCode,
    testId: 'jar-xml-formatter',
  },
  {
    id: 'timezone-converter',
    nameKey: 'jars.timezoneConverter.name',
    descriptionKey: 'jars.timezoneConverter.description',
    href: '/jars/timezone-converter',
    icon: Globe,
    testId: 'jar-timezone-converter',
  },
];
