import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, setMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  redis: { get: getMock, set: setMock },
}));

const { GET, PUT } = await import('./route');

const params = (jar: string, code: string) => ({ params: Promise.resolve({ jar, code }) });

beforeEach(() => {
  getMock.mockReset();
  setMock.mockReset();
});

describe('GET /api/sync/[jar]/[code]', () => {
  it('returns the stored envelope when present', async () => {
    getMock.mockResolvedValue({ data: { boards: [] }, updatedAt: '2026-01-01T00:00:00.000Z' });

    const res = await GET(new NextRequest('http://localhost/api/sync/idea-board/abc123'), params('idea-board', 'abc123'));

    expect(getMock).toHaveBeenCalledWith('software-jars:sync:idea-board:abc123');
    expect(await res.json()).toEqual({ data: { boards: [] }, updatedAt: '2026-01-01T00:00:00.000Z' });
  });

  it('returns null data when nothing is stored yet', async () => {
    getMock.mockResolvedValue(null);

    const res = await GET(new NextRequest('http://localhost/api/sync/idea-board/abc123'), params('idea-board', 'abc123'));

    expect(await res.json()).toEqual({ data: null, updatedAt: null });
  });

  it('rejects an invalid jar or code segment', async () => {
    const res = await GET(new NextRequest('http://localhost/api/sync/../abc'), params('../etc', 'abc123'));
    expect(res.status).toBe(400);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns 503 instead of throwing when Redis is unreachable/unconfigured', async () => {
    getMock.mockRejectedValue(new Error('missing url/token'));

    const res = await GET(new NextRequest('http://localhost/api/sync/idea-board/abc123'), params('idea-board', 'abc123'));
    expect(res.status).toBe(503);
  });
});

describe('PUT /api/sync/[jar]/[code]', () => {
  it('stores the body under a namespaced key with a server-set timestamp', async () => {
    setMock.mockResolvedValue('OK');

    const body = { boards: [{ id: '1', name: 'Trip', columns: [] }] };
    const request = new NextRequest('http://localhost/api/sync/idea-board/abc123', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const res = await PUT(request, params('idea-board', 'abc123'));
    const json = await res.json();

    expect(setMock).toHaveBeenCalledTimes(1);
    const [key, envelope, options] = setMock.mock.calls[0];
    expect(key).toBe('software-jars:sync:idea-board:abc123');
    expect(envelope).toEqual({ data: body, updatedAt: expect.any(String) });
    expect(options).toEqual({ ex: 60 * 60 * 24 * 90 });
    expect(json).toEqual({ updatedAt: envelope.updatedAt });
  });

  it('rejects invalid JSON bodies', async () => {
    const request = new NextRequest('http://localhost/api/sync/idea-board/abc123', {
      method: 'PUT',
      body: 'not json',
    });

    const res = await PUT(request, params('idea-board', 'abc123'));
    expect(res.status).toBe(400);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized payload', async () => {
    const huge = JSON.stringify({ text: 'x'.repeat(600_000) });
    const request = new NextRequest('http://localhost/api/sync/idea-board/abc123', {
      method: 'PUT',
      body: huge,
    });

    const res = await PUT(request, params('idea-board', 'abc123'));
    expect(res.status).toBe(413);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid jar or code segment', async () => {
    const request = new NextRequest('http://localhost/api/sync/x/y', { method: 'PUT', body: '{}' });
    const res = await PUT(request, params('bad jar!', 'abc123'));
    expect(res.status).toBe(400);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('returns 503 instead of throwing when Redis is unreachable/unconfigured', async () => {
    setMock.mockRejectedValue(new Error('missing url/token'));

    const request = new NextRequest('http://localhost/api/sync/idea-board/abc123', { method: 'PUT', body: '{}' });
    const res = await PUT(request, params('idea-board', 'abc123'));
    expect(res.status).toBe(503);
  });
});
