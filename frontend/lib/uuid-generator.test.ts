import { beforeEach, describe, expect, it } from 'vitest';
import { generateUuid, generateUuidV1, generateUuidV4, resetUuidGeneratorForTests } from './uuid-generator';

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(() => {
  resetUuidGeneratorForTests();
});

describe('generateUuidV4', () => {
  it('returns a correctly shaped UUID with version 4 and variant bits set', () => {
    const uuid = generateUuidV4();
    expect(uuid).toMatch(UUID_SHAPE);
    expect(uuid[14]).toBe('4');
    expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
  });

  it('generates distinct UUIDs across calls', () => {
    const a = generateUuidV4();
    const b = generateUuidV4();
    expect(a).not.toBe(b);
  });
});

describe('generateUuidV1', () => {
  it('returns a correctly shaped UUID with version 1 and variant bits set', () => {
    const uuid = generateUuidV1();
    expect(uuid).toMatch(UUID_SHAPE);
    expect(uuid[14]).toBe('1');
    expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
  });

  it('sets the multicast bit on the node id (marking it as a random, not a real MAC)', () => {
    const uuid = generateUuidV1();
    const nodeFirstByte = parseInt(uuid.split('-')[4].slice(0, 2), 16);
    expect(nodeFirstByte & 0x01).toBe(1);
  });

  it('generates distinct UUIDs even when called back to back in the same millisecond', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateUuidV1()));
    expect(ids.size).toBe(50);
  });

  it('keeps the timestamp monotonically increasing across rapid calls', () => {
    const extractTimestamp = (uuid: string): bigint => {
      const [timeLow, timeMid, timeHiAndVersion] = uuid.split('-');
      const hi = BigInt(parseInt(timeHiAndVersion, 16) & 0x0fff);
      const mid = BigInt(parseInt(timeMid, 16));
      const low = BigInt(parseInt(timeLow, 16));
      return (hi << BigInt(48)) | (mid << BigInt(32)) | low;
    };

    let previous = extractTimestamp(generateUuidV1());
    for (let i = 0; i < 20; i++) {
      const current = extractTimestamp(generateUuidV1());
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });
});

describe('generateUuid', () => {
  it('dispatches to v4 for version 4', () => {
    expect(generateUuid(4)[14]).toBe('4');
  });

  it('dispatches to v1 for version 1', () => {
    expect(generateUuid(1)[14]).toBe('1');
  });
});
