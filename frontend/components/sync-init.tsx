'use client';
// Side-effect-only imports: every localStorage-backed jar's store (and its
// attachRemoteSync wiring, if it opts into cross-device sync) is normally
// only initialized lazily when that jar's own page is first visited this
// session. That means generating/linking a sync code on Settings wouldn't
// reach a jar you haven't opened yet in this tab. This component's only job
// is to force those modules to actually load in the browser on every page,
// regardless of which page that is — it must be a real 'use client' module
// (not just imported from a Server Component like app-shell.tsx) for the
// imports below to end up in the client bundle at all. Add new sync-enabled
// jars' imports here.
import '@/lib/idea-board';
import '@/lib/idea-matrix';

export const SyncInit = () => null;
