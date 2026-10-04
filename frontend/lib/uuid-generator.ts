export type UuidVersion = 4 | 1;

export const generateUuidV4 = (): string => crypto.randomUUID();

// V1 UUIDs encode a timestamp + a node id. Real v1 generators traditionally
// use the machine's MAC address for the node id, but browsers have no access
// to one — RFC 4122 explicitly allows substituting random bits instead (with
// the multicast bit set so it's never mistaken for a real MAC), which is
// what every browser-side v1 implementation does. Not persisted across
// reloads, so this doesn't trade away any privacy a real MAC-based node id
// would.
//
// BigInt() function calls (not `123n` literal syntax) throughout — this
// project's tsconfig targets ES2017, and literal BigInt syntax needs
// ES2020+. The epoch offset is built from a string so it isn't first
// rounded through an imprecise `number` (it's well past Number.MAX_SAFE_INTEGER).
const GREGORIAN_TO_UNIX_EPOCH_100NS = BigInt('122192928000000000');

let lastTimestamp100ns: bigint | null = null;

export const generateUuidV1 = (): string => {
  let timestamp100ns = BigInt(Date.now()) * BigInt(10000) + GREGORIAN_TO_UNIX_EPOCH_100NS;
  // Date.now() only has millisecond resolution; if called again within the
  // same millisecond, bump by one 100ns tick so two UUIDs minted back to
  // back never collide on their timestamp field.
  if (lastTimestamp100ns !== null && timestamp100ns <= lastTimestamp100ns) {
    timestamp100ns = lastTimestamp100ns + BigInt(1);
  }
  lastTimestamp100ns = timestamp100ns;

  const timeLow = timestamp100ns & BigInt(0xffffffff);
  const timeMid = (timestamp100ns >> BigInt(32)) & BigInt(0xffff);
  const timeHiAndVersion = ((timestamp100ns >> BigInt(48)) & BigInt(0x0fff)) | BigInt(0x1000); // version 1

  const random = crypto.getRandomValues(new Uint8Array(8));
  const clockSeq = (((random[0] << 8) | random[1]) & 0x3fff) | 0x8000; // variant 10xx

  const node = Array.from(random.slice(2, 8));
  node[0] |= 0x01; // multicast bit set — marks this as a random, not a real MAC-derived, node id

  const hex = (value: number | bigint, length: number) => value.toString(16).padStart(length, '0');

  return [
    hex(timeLow, 8),
    hex(timeMid, 4),
    hex(timeHiAndVersion, 4),
    hex(clockSeq, 4),
    node.map((byte) => hex(byte, 2)).join(''),
  ].join('-');
};

export const generateUuid = (version: UuidVersion): string => (version === 4 ? generateUuidV4() : generateUuidV1());

// Only for tests — the intra-millisecond collision guard above is module-
// scoped state that would otherwise leak between test cases.
export const resetUuidGeneratorForTests = (): void => {
  lastTimestamp100ns = null;
};
