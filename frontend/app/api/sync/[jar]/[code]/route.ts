import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

// Keeps abandoned/forgotten sync codes from accumulating in Redis forever.
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const MAX_BODY_BYTES = 500_000; // 500KB — generous for a jar's JSON state, cheap abuse guard

// A code is a client-generated crypto.randomUUID(); a jar id is one of the
// short kebab-case ids in lib/jars.ts. Neither is ever attacker-controlled in
// normal use, but this endpoint has no auth beyond "knows the code", so these
// are basic sanity bounds, not a security boundary.
const isValidSegment = (value: string): boolean => /^[a-zA-Z0-9-]{1,100}$/.test(value);

type SyncEnvelope = {
  data: unknown;
  updatedAt: string;
};

const buildKey = (jar: string, code: string): string => `software-jars:sync:${jar}:${code}`;

type RouteParams = { params: Promise<{ jar: string; code: string }> };

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { jar, code } = await params;
  if (!isValidSegment(jar) || !isValidSegment(code)) {
    return NextResponse.json({ error: 'Invalid jar or code' }, { status: 400 });
  }

  try {
    const stored = await redis.get<SyncEnvelope>(buildKey(jar, code));
    return NextResponse.json(stored ?? { data: null, updatedAt: null });
  } catch {
    // Most commonly: Redis isn't configured yet (no UPSTASH_* env vars). The
    // client already treats a non-ok response as "skip this sync, try later".
    return NextResponse.json({ error: 'Sync storage unavailable' }, { status: 503 });
  }
};

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { jar, code } = await params;
  if (!isValidSegment(jar) || !isValidSegment(code)) {
    return NextResponse.json({ error: 'Invalid jar or code' }, { status: 400 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const envelope: SyncEnvelope = { data, updatedAt: new Date().toISOString() };

  try {
    await redis.set(buildKey(jar, code), envelope, { ex: TTL_SECONDS });
    return NextResponse.json({ updatedAt: envelope.updatedAt });
  } catch {
    return NextResponse.json({ error: 'Sync storage unavailable' }, { status: 503 });
  }
};
