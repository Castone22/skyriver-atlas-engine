import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The wiki serves the loader in an opaque-origin sandbox, so every image is cross-origin there. A canvas
// that reads such an image's pixels (getImageData) or a WebGL texture made from it fails unless the image
// was requested with CORS. A page that builds its own Image must therefore set crossOrigin before src.
const ROOT = fileURLToPath(new URL('../', import.meta.url));

test('every Image a bundle or engine function creates is requested with CORS', async () => {
  const files = [];
  for (const id of await readdir(path.join(ROOT, 'bundles')))
    for (const name of await readdir(path.join(ROOT, 'bundles', id)))
      if (/^runtime-\d+\.js$/.test(name)) files.push(path.join('bundles', id, name));
  for (const name of await readdir(path.join(ROOT, 'engine/functions')))
    files.push(path.join('engine/functions', name));
  const missing = [];
  for (const file of files) {
    const text = await readFile(path.join(ROOT, file), 'utf8');
    for (const m of text.matchAll(/new Image\(\)/g)) {
      // the statement that builds the image: up to the line that sets its src
      const rest = text.slice(m.index, m.index + 240);
      if (!/crossOrigin\s*=\s*['"]anonymous['"]/.test(rest)) missing.push(file);
    }
  }
  assert.deepEqual(missing, [], 'set image.crossOrigin = "anonymous" before image.src');
});
