import { Redis } from '@upstash/redis';

// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from the environment.
// Only imported by the sync API route (server-side) — never bundled to the client.
export const redis = Redis.fromEnv();
