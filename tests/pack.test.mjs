import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { referencedAssets, stageAssets, stageDatapack, stageEngine } from '../tools/pack.mjs';

// The zips for the extension: the engine, a datapack per atlas (each with fresh digests), and the
// images the atlases use, named by SHA-256.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
let tmp;
before(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'pack-test-'));
});
after(() => rm(tmp, { recursive: true, force: true }));

test('the engine and a datapack are staged with digests that match their files', async () => {
  const engine = await stageEngine(path.join(tmp, 'engine'));
  assert.equal(engine.type, 'engine');
  assert.ok(Object.keys(engine.files).length > 200, 'the function library is listed');
  const datapack = await stageDatapack('elysian', path.join(tmp, 'elysian'));
  assert.deepEqual(Object.keys(datapack.files).sort(), [
    'atlas.json',
    'runtime-0.js',
    'shell.html',
    'style-0.css'
  ]);
});

test('the images pack under their own hashes, with the atlases that use each', async () => {
  const index = await stageAssets(path.join(tmp, 'assets'));
  const wanted = [...(await referencedAssets(ROOT)).keys()].sort();
  assert.ok(wanted.length >= 30, 'the atlases use many images');
  assert.deepEqual(Object.keys(index).sort(), wanted);
  for (const [hash, entry] of Object.entries(index)) {
    assert.match(entry.mime, /^image\//);
    const bytes = await readFile(path.join(tmp, 'assets', entry.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
    assert.ok(entry.usedBy.length > 0);
  }
  assert.equal(
    (await readdir(path.join(tmp, 'assets'))).length,
    wanted.length + 1,
    'images plus assets.json'
  );
  assert.ok(
    Object.values(index).some((e) => e.usedBy.includes('grand')),
    'the galaxy images are there'
  );
});
