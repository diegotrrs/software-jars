import { describe, expect, it } from 'vitest';
import { formatXml, minifyXml, validateXml } from './xml-formatter';

describe('validateXml', () => {
  it('reports valid for well-formed XML', () => {
    expect(validateXml('<root><a>1</a></root>')).toEqual({ valid: true });
  });

  it('reports invalid for unclosed tags', () => {
    const result = validateXml('<root><a>1</a>');
    expect(result.valid).toBe(false);
  });

  it('reports invalid for empty input', () => {
    expect(validateXml('').valid).toBe(false);
    expect(validateXml('   ').valid).toBe(false);
  });

  it('reports invalid for multiple root elements', () => {
    expect(validateXml('<a/><b/>').valid).toBe(false);
  });
});

describe('minifyXml', () => {
  it('collapses whitespace between tags only', () => {
    const result = minifyXml('<root>\n  <a>hello world</a>\n  <b/>\n</root>');
    expect(result).toEqual({ success: true, value: '<root><a>hello world</a><b/></root>' });
  });

  it('returns an error for invalid XML', () => {
    expect(minifyXml('<root><a></root>').success).toBe(false);
  });
});

describe('formatXml', () => {
  it('indents nested elements by depth', () => {
    const result = formatXml('<root><a><b>1</b></a></root>');
    expect(result).toEqual({
      success: true,
      value: '<root>\n  <a>\n    <b>1</b>\n  </a>\n</root>',
    });
  });

  it('keeps siblings at the same indent level', () => {
    const result = formatXml('<root><a>1</a><b>2</b></root>');
    expect(result).toEqual({
      success: true,
      value: '<root>\n  <a>1</a>\n  <b>2</b>\n</root>',
    });
  });

  it('does not increase indent for self-closing tags', () => {
    const result = formatXml('<root><a/><b>text</b></root>');
    expect(result).toEqual({
      success: true,
      value: '<root>\n  <a/>\n  <b>text</b>\n</root>',
    });
  });

  it('respects a custom indent size', () => {
    const result = formatXml('<root><a>1</a></root>', 4);
    expect(result).toEqual({ success: true, value: '<root>\n    <a>1</a>\n</root>' });
  });

  it('handles an XML declaration without affecting nesting', () => {
    const result = formatXml('<?xml version="1.0"?><root><a>1</a></root>');
    expect(result).toEqual({
      success: true,
      value: '<?xml version="1.0"?>\n<root>\n  <a>1</a>\n</root>',
    });
  });

  it('is idempotent — formatting already-formatted XML returns the same output', () => {
    const once = formatXml('<root><a><b>1</b><c/></a></root>');
    expect(once.success).toBe(true);
    if (!once.success) return;
    const twice = formatXml(once.value);
    expect(twice).toEqual(once);
  });

  it('returns an error for invalid XML instead of throwing', () => {
    expect(() => formatXml('<root><a></root>')).not.toThrow();
    expect(formatXml('<root><a></root>').success).toBe(false);
  });
});
