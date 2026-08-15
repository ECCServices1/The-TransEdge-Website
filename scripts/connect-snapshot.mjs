#!/usr/bin/env node
/**
 * Refreshes the Connect fallback snapshots from a live Connect.
 *
 * The fallback is only useful if it is current. A snapshot taken on launch day
 * and never touched again is a fallback that quietly serves last year's events
 * the first time Connect has an outage.
 *
 * Run it from CI on a schedule once the read API exists, and commit the result.
 *
 *   CONNECT_API_URL=https://connect.thetransedge.com/api \
 *   CONNECT_API_TOKEN=... \
 *   npm run connect:snapshot
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src', 'data', 'connect');

const base = process.env.CONNECT_API_URL;
const token = process.env.CONNECT_API_TOKEN;

if (!base) {
  console.error('CONNECT_API_URL is not set. Nothing to snapshot.');
  console.error('This is expected until the Connect read API exists: see docs/connect-api-contract.md.');
  process.exit(1);
}

const COLLECTIONS = {
  events: '/v1/events?status=published',
  episodes: '/v1/edgedin/assets?status=published',
  sermons: '/v1/sermons?status=published',
};

let failed = false;

for (const [name, path] of Object.entries(COLLECTIONS)) {
  try {
    const response = await fetch(new URL(path, base), {
      headers: {
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(items)) throw new Error('response was not an array and had no data array');

    // An empty response is never written over a non-empty snapshot. Overwriting
    // a good fallback with nothing is the one failure this script must not have.
    if (items.length === 0) {
      console.warn(`${name}: Connect returned zero items. Snapshot left as it was.`);
      continue;
    }

    await writeFile(join(OUT, `${name}.snapshot.json`), JSON.stringify(items, null, 2) + '\n', 'utf8');
    console.log(`${name}: ${items.length} item(s) written.`);
  } catch (error) {
    failed = true;
    console.error(`${name}: ${error instanceof Error ? error.message : error}`);
  }
}

process.exit(failed ? 1 : 0);
