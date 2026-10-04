import { describe, expect, it } from 'vitest';
import { formatJson, minifyJson, validateJson } from './json-formatter';

describe('formatJson', () => {
  it('pretty-prints valid JSON with 2-space indent by default', () => {
    const result = formatJson('{"a":1,"b":[1,2]}');
    expect(result).toEqual({ success: true, value: '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}' });
  });

  it('respects a custom indent size', () => {
    const result = formatJson('{"a":1}', 4);
    expect(result).toEqual({ success: true, value: '{\n    "a": 1\n}' });
  });

  it('returns an error for invalid JSON', () => {
    const result = formatJson('{a:1}');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.length).toBeGreaterThan(0);
  });
});

describe('minifyJson', () => {
  it('strips all insignificant whitespace', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": [1, 2]\n}');
    expect(result).toEqual({ success: true, value: '{"a":1,"b":[1,2]}' });
  });

  it('returns an error for invalid JSON', () => {
    const result = minifyJson('not json');
    expect(result.success).toBe(false);
  });
});

describe('validateJson', () => {
  it('reports valid for well-formed JSON', () => {
    expect(validateJson('{"ok": true}')).toEqual({ valid: true });
  });

  it('reports invalid with an error message for malformed JSON', () => {
    const result = validateJson('{"ok": tru}');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.length).toBeGreaterThan(0);
  });

  it('treats an empty string as invalid rather than throwing', () => {
    const result = validateJson('');
    expect(result.valid).toBe(false);
  });
});
