import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Bundle, openBundle } from './bundle.mjs';

/** Directory transport: lists files recursively and reads them lazily as UTF-8 text. */
export async function loadDirectory(dir, options) {
  const root = path.resolve(dir);
  const files = [];
  async function walk(rel) {
    for (const entry of await readdir(path.join(root, rel), { withFileTypes: true })) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(next);
      else files.push(next);
    }
  }
  await walk('');
  return openBundle(
    new Bundle({ files, read: (p) => readFile(path.join(root, ...p.split('/')), 'utf8') }),
    options
  );
}
