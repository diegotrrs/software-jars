export type JsonResult = { success: true; value: string } | { success: false; error: string };

const parseJson = (input: string): { data: unknown } | { error: string } => {
  try {
    return { data: JSON.parse(input) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid JSON' };
  }
};

export const formatJson = (input: string, indent = 2): JsonResult => {
  const parsed = parseJson(input);
  if ('error' in parsed) return { success: false, error: parsed.error };
  return { success: true, value: JSON.stringify(parsed.data, null, indent) };
};

export const minifyJson = (input: string): JsonResult => {
  const parsed = parseJson(input);
  if ('error' in parsed) return { success: false, error: parsed.error };
  return { success: true, value: JSON.stringify(parsed.data) };
};

export const validateJson = (input: string): { valid: true } | { valid: false; error: string } => {
  const parsed = parseJson(input);
  return 'error' in parsed ? { valid: false, error: parsed.error } : { valid: true };
};
