export type Base64DecodeResult = { success: true; value: string } | { success: false; error: string };

// btoa()/atob() only operate on Latin1 ("binary string") data and throw on
// anything outside that range (emoji, accented characters, etc). Routing
// through TextEncoder/TextDecoder first makes both directions UTF-8 safe.
export const encodeBase64 = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const CHUNK_SIZE = 0x8000; // keeps String.fromCharCode's argument list bounded on huge inputs
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
};

export const decodeBase64 = (input: string): Base64DecodeResult => {
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    // `fatal: true` rejects byte sequences that aren't valid UTF-8, rather
    // than silently producing U+FFFD replacement characters for base64 that
    // decodes to non-text binary data.
    const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { success: true, value };
  } catch {
    return { success: false, error: 'Invalid Base64 input.' };
  }
};
