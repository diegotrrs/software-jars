import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64';

describe('encodeBase64', () => {
  it('encodes plain ASCII text', () => {
    expect(encodeBase64('hello world')).toBe('aGVsbG8gd29ybGQ=');
  });

  it('encodes an empty string to an empty string', () => {
    expect(encodeBase64('')).toBe('');
  });

  it('round-trips unicode text (emoji, accents) correctly', () => {
    const original = 'café ☕️ 日本語';
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);
    expect(decoded).toEqual({ success: true, value: original });
  });

  it('handles very long input without blowing the call stack', () => {
    const long = 'x'.repeat(200_000);
    expect(() => encodeBase64(long)).not.toThrow();
    expect(decodeBase64(encodeBase64(long))).toEqual({ success: true, value: long });
  });
});

describe('decodeBase64', () => {
  it('decodes valid Base64 back to the original text', () => {
    expect(decodeBase64('aGVsbG8gd29ybGQ=')).toEqual({ success: true, value: 'hello world' });
  });

  it('returns an error for input with invalid Base64 characters', () => {
    const result = decodeBase64('not valid base64!!!');
    expect(result.success).toBe(false);
  });

  it('returns an error for base64 that decodes to invalid UTF-8', () => {
    // 0xFF 0xFE is not a valid UTF-8 byte sequence.
    const result = decodeBase64('//4=');
    expect(result.success).toBe(false);
  });
});
