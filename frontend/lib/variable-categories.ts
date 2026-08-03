import enCategories from '@/lib/data/variable-categories.en.json';
import esCategories from '@/lib/data/variable-categories.es.json';

export type VariableCategoryOption = {
  id: string;
  label: string;
};

export type VariableCategory = {
  id: string;
  name: string;
  options: VariableCategoryOption[];
};

const categoriesByLocale: Record<string, VariableCategory[]> = {
  en: enCategories,
  es: esCategories,
};

export const getVariableCategories = (locale: string): VariableCategory[] =>
  categoriesByLocale[locale] ?? categoriesByLocale.en;

export const searchVariableCategories = (locale: string, query: string): VariableCategory[] => {
  const categories = getVariableCategories(locale);
  const normalized = query.trim().toLowerCase();
  if (!normalized) return categories;

  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(normalized) ||
      category.options.some((option) => option.label.toLowerCase().includes(normalized))
  );
};
