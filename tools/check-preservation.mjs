// Optional migration check: compare complete source catalogues against extracted definitions.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url)),
  source = process.argv[2];
if (!source) throw new Error('Supply the original HTML source directory');
const manifest = JSON.parse(await readFile(path.join(root, 'docs/source-manifest.json'))),
  assets = JSON.parse(await readFile(path.join(root, 'assets/manifest.json'))),
  results = [];
function dataLiteral(text) {
  const m = /\bconst\s+DATA\s*=\s*(\{)/.exec(text);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0,
    inside = false,
    escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inside) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') inside = false;
    } else if (c === '"') inside = true;
    else if (c === '{') depth++;
    else if (c === '}' && !--depth) return JSON.parse(text.slice(start, i + 1));
  }
  throw Error('Unclosed DATA');
}
for (const row of manifest) {
  const html = await readFile(path.join(source, row.file), 'utf8');
  assert.equal(createHash('sha256').update(html).digest('hex'), row.sha256);
  const original = dataLiteral(html);
  if (!original) continue;
  const definition = JSON.parse(await readFile(path.join(root, 'data/' + row.id + '.json')));
  let serialized = JSON.stringify(definition.data);
  for (const id of new Set(
    [...serialized.matchAll(/atlas-asset:([a-f0-9]{64})/g)].map((m) => m[1])
  )) {
    const a = assets[id],
      bytes = await readFile(path.join(root, a.file));
    serialized = serialized
      .split('atlas-asset:' + id)
      .join(`data:${a.mime};base64,${bytes.toString('base64')}`);
  }
  assert.deepEqual(JSON.parse(serialized), original, row.id + ' complete source data');
  const built = dataLiteral(
    await readFile(path.join(root, 'dist/' + row.id + '-atlas.html'), 'utf8')
  );
  assert.deepEqual(built, original, row.id + ' complete generated data');
  results.push({
    id: row.id,
    sourceHashMatches: true,
    completeCatalogueMatches: true,
    generatedCatalogueMatches: true
  });
}
await writeFile(
  path.join(root, 'docs/data-preservation.json'),
  JSON.stringify(results, null, 2) + '\n'
);
console.log('Full catalogue preservation:', results.length, 'atlases');
