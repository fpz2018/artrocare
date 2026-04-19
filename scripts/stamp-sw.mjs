// Replace __BUILD_ID__ in the built service worker with a unique per-build id.
// Run after `vite build`. The id is a timestamp so each deploy gets a fresh
// cache name, which invalidates the previous deploy's cache on activation.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const swPath = resolve('dist', 'sw.js');

if (!existsSync(swPath)) {
  console.error(`[stamp-sw] ${swPath} not found. Did vite build run?`);
  process.exit(1);
}

const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const src = readFileSync(swPath, 'utf8');

if (!src.includes('__BUILD_ID__')) {
  console.warn('[stamp-sw] __BUILD_ID__ placeholder not found — service worker left untouched.');
  process.exit(0);
}

writeFileSync(swPath, src.replaceAll('__BUILD_ID__', buildId));
console.log(`[stamp-sw] service worker stamped with build id: ${buildId}`);
