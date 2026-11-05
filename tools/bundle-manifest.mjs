#!/usr/bin/env node
// Write or check the `files` digests in a bundle's bundle.json.
//   node tools/bundle-manifest.mjs <bundle dir>           update bundle.json
//   node tools/bundle-manifest.mjs <bundle dir> --check   exit 1 if digests are stale
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDirectory } from '../src/bundle-fs.mjs';
import { sha256Text } from '../src/bundle.mjs';

/** Compute the `files` map for a directory bundle: every file except bundle.json, sorted. */
export async function computeFiles(dir) {
  // List the directory directly: a stale `files` map must not stop us from recomputing it.
  const files = {};
  for (const p of (await listDirectory(dir)).filter((f) => f !== 'bundle.json').sort())
    files[p] = await sha256Text(await readFile(path.join(dir, ...p.split('/')), 'utf8'));
  return files;
}

/** Update bundle.json in `dir`. With check=true nothing is written. Returns { changed, files }. */
export async function updateManifest(dir, { check = false } = {}) {
  const file = path.join(dir, 'bundle.json');
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const files = await computeFiles(dir);
  const changed = JSON.stringify(manifest.files ?? {}) !== JSON.stringify(files);
  if (changed && !check) {
    manifest.files = files;
    await writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
  }
  return { changed, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dir, flag] = process.argv.slice(2);
  if (!dir) throw new Error('Usage: bundle-manifest.mjs <bundle dir> [--check]');
  const { changed, files } = await updateManifest(dir, { check: flag === '--check' });
  const state = changed ? (flag === '--check' ? 'STALE' : 'updated') : 'up to date';
  console.log(`${dir}: ${Object.keys(files).length} files, ${state}`);
  if (changed && flag === '--check') process.exitCode = 1;
}
