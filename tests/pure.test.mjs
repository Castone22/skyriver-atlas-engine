import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Bundle, openBundle } from '../src/bundle.mjs';
import { loadDirectory } from '../src/bundle-fs.mjs';
import { compileCore } from '../src/compile-core.mjs';
import { compile, createNodeHost } from '../src/compiler.mjs';

// These modules must be able to run in a browser.
const PURE = ['atlas', 'template', 'bundle', 'compile-core'];

test('pure modules import nothing from Node and touch no Node globals', async () => {
  for (const name of PURE) {
    const source = await readFile(new URL(`../src/${name}.mjs`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /from\s+['"]node:/, `${name}.mjs imports a Node module`);
    assert.doesNotMatch(source, /\b(?:Buffer|process|__dirname|__filename)\b|\brequire\(/, name);
  }
});

/** Copy a directory bundle into memory so the compiler cannot reach the disk through it. */
async function inMemory(dir, expectType) {
  const disk = await loadDirectory(dir, { expectType });
  const files = new Map();
  for (const f of disk.files) files.set(f, await disk.text(f));
  return openBundle(Bundle.fromMap(files), { expectType });
}

test('compileCore needs only its host: in-memory bundles produce the same HTML as disk', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const engine = await inMemory(`${root}engine`, 'engine');
  const atlas = await inMemory(`${root}bundles/calidor`, 'atlas');
  const definition = await atlas.json('atlas.json');
  const disk = createNodeHost();
  const calls = [];
  const host = {
    engine: async () => (calls.push('engine'), engine),
    atlas: async (id) => (calls.push('atlas:' + id), id === 'calidor' ? atlas : null),
    asset: (id) => (calls.push('asset'), disk.asset(id))
  };
  const result = await compileCore(definition, host);
  const expected = await compile(definition);
  assert.equal(result.html, expected.html);
  assert.ok(calls.includes('engine') && calls.includes('atlas:calidor'));
});

test('a galaxy atlas without gzip support fails with a clear message', async () => {
  const disk = createNodeHost();
  const host = { engine: disk.engine, atlas: disk.atlas, asset: disk.asset };
  const definition = await (await disk.atlas('grand')).json('atlas.json');
  await assert.rejects(compileCore(definition, host), /cannot gzip child snapshots/);
});

test('an unknown renderer is reported as invalid', async () => {
  const disk = createNodeHost();
  const definition = await (await disk.atlas('calidor')).json('atlas.json');
  await assert.rejects(
    compileCore({ ...definition, renderer: 'no-such-bundle' }, disk),
    /Invalid stellar renderer: no-such-bundle/
  );
});

test('a bundle needing a newer engine is rejected', async () => {
  const disk = createNodeHost();
  const real = await disk.atlas('calidor');
  const demanding = Object.create(real);
  demanding.manifest = { ...real.manifest, engine: '^2.0.0' };
  const definition = await real.json('atlas.json');
  await assert.rejects(
    compileCore(definition, { ...disk, atlas: async () => demanding }),
    /needs engine \^2\.0\.0; this is engine 1\.0\.0/
  );
});
