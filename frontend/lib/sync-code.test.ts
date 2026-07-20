import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSyncCode, generateSyncCode, getSyncCode, setSyncCode, subscribeSyncCode } from './sync-code';

afterEach(() => {
  window.localStorage.removeItem('software-jars:sync-code');
});

describe('sync code', () => {
  it('has no code by default', () => {
    expect(getSyncCode()).toBeNull();
  });

  it('generateSyncCode creates and persists a code', () => {
    const code = generateSyncCode();
    expect(code).toBeTruthy();
    expect(getSyncCode()).toBe(code);
  });

  it('setSyncCode stores an explicit code, e.g. one entered from another device', () => {
    setSyncCode('code-from-other-device');
    expect(getSyncCode()).toBe('code-from-other-device');
  });

  it('clearSyncCode removes the stored code', () => {
    generateSyncCode();
    clearSyncCode();
    expect(getSyncCode()).toBeNull();
  });

  it('subscribeSyncCode notifies listeners on generate/set/clear', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSyncCode(listener);

    generateSyncCode();
    expect(listener).toHaveBeenCalledTimes(1);

    setSyncCode('another-code');
    expect(listener).toHaveBeenCalledTimes(2);

    clearSyncCode();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    generateSyncCode();
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
