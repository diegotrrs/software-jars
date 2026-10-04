export type XmlResult = { success: true; value: string } | { success: false; error: string };

// Browsers (and jsdom in tests) don't expose a "pretty print" for XML, only
// DOMParser (which validates) and XMLSerializer (which re-serializes without
// indentation). So validation is real DOM parsing, but formatting is a
// practical hand-rolled indenter — not a full XML-spec-compliant
// pretty-printer (e.g. significant whitespace inside mixed text/element
// content isn't specially preserved), which is the same tradeoff most
// online XML formatters make.
// Chromium's <parsererror> text comes wrapped in generic boilerplate
// ("This page contains the following errors: ... Below is a rendering of
// the page up to the first error.") — strip that down to just the
// "error on line X at column Y: ..." part that's actually useful here.
const cleanParserErrorText = (text: string): string => {
  const match = text.match(/error on line \d+.*?:.*/);
  return (match ? match[0] : text).trim();
};

const parseXml = (input: string): { error: string } | { ok: true } => {
  if (!input.trim()) return { error: 'Empty input.' };
  const doc = new DOMParser().parseFromString(input, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) return { error: cleanParserErrorText(parserError.textContent || 'Invalid XML.') };
  return { ok: true };
};

export const validateXml = (input: string): { valid: true } | { valid: false; error: string } => {
  const result = parseXml(input);
  return 'error' in result ? { valid: false, error: result.error } : { valid: true };
};

export const minifyXml = (input: string): XmlResult => {
  const check = parseXml(input);
  if ('error' in check) return { success: false, error: check.error };
  // Only collapses whitespace strictly between two tags (`>   <` → `><`) —
  // whitespace inside text content (`>hello world<`) is untouched.
  return { success: true, value: input.trim().replace(/>\s+</g, '><') };
};

export const formatXml = (input: string, indentSize = 2): XmlResult => {
  const check = parseXml(input);
  if ('error' in check) return { success: false, error: check.error };

  const PAD = ' '.repeat(indentSize);
  const collapsed = input.trim().replace(/>\s+</g, '><');
  const withBreaks = collapsed.replace(/>(<\/?)/g, '>\n$1');

  let depth = 0;
  const lines = withBreaks
    .split('\n')
    .map((rawLine) => rawLine.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const isClosingTag = /^<\//.test(line);
      // A tag that opens and closes on the same line (`<a>text</a>`), a
      // self-closing tag (`<a/>`), an XML declaration, a comment, or a
      // CDATA section are all leaves — they don't change the nesting depth.
      const isLeaf =
        /\/>$/.test(line) ||
        /^<\?/.test(line) ||
        /^<!--[\s\S]*-->$/.test(line) ||
        /^<!\[CDATA\[[\s\S]*\]\]>$/.test(line) ||
        /^<([\w:.-]+)(?:\s[^>]*)?>[^<]*<\/\1>$/.test(line);

      let indentAt = depth;
      if (isClosingTag) {
        depth = Math.max(0, depth - 1);
        indentAt = depth;
      } else if (!isLeaf) {
        depth += 1;
      }
      return PAD.repeat(indentAt) + line;
    });

  return { success: true, value: lines.join('\n') };
};
