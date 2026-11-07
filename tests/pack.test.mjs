import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../src/bundle.mjs';
import { createBrowserHost } from '../src/host-browser.mjs';
import { compileCore } from '../src/compile-core.mjs';
import { compile } from '../src/compiler.mjs';
import { referencedAssets, stageDatapack, stageEngine } from '../tools/pack.mjs';

// The zips for the extension: the engine carries every image the atlases use, as text, so the extension
// needs no asset store.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
let tmp, engineManifest, calidorManifest;

before(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'pack-test-'));
  engineManifest = await stageEngine(path.join(tmp, 'engine'));
  calidorManifest = await stageDatapack('calidor', path.join(tmp, 'bundles', 'calidor'));
});
after(() => rm(tmp, { recursive: true, force: true }));

/** A fetch that serves the staged directories, as the extension would. */
const fakeFetch = async (address) => {
  const rel = decodeURIComponent(new URL(address).pathname).replace(/^\//, '');
  try {
    const body = await readFile(path.join(tmp, rel));
    return new Response(body, { status: 200 });
  } catch {
    return new Response('', { status: 404 });
  }
};
const hostFor = (extra = {}) =>
  createBrowserHost({
    engineUrl: 'http://wiki.test/engine/',
    atlasUrl: (id) => `http://wiki.test/bundles/${id}/`,
    fetch: fakeFetch,
    ...extra
  });

test('the engine pack lists and carries every image the bundles use, each under its own hash', async () => {
  const wanted = await referencedAssets(ROOT);
  assert.ok(wanted.length >= 30, 'the atlases use many images');
  assert.deepEqual(Object.keys(engineManifest.assets).sort(), wanted);
  for (const [hash, entry] of Object.entries(engineManifest.assets)) {
    assert.match(entry.mime, /^image\//);
    const text = await readFile(path.join(tmp, 'engine', entry.file), 'utf8');
    assert.equal(createHash('sha256').update(Buffer.from(text, 'base64')).digest('hex'), hash);
    assert.ok(engineManifest.files[entry.file], 'the image file has a digest');
  }
});

test('the browser host reads an engine image and inlines it as a data URL', async () => {
  const hash = Object.keys(engineManifest.assets)[0];
  const url = await hostFor().asset(hash);
  const [, mime, body] = /^data:([^;]+);base64,(.+)$/.exec(url);
  assert.equal(mime, engineManifest.assets[hash].mime);
  assert.equal(createHash('sha256').update(Buffer.from(body, 'base64')).digest('hex'), hash);
});

test('an image the engine does not carry comes from the asset address, else it is an error', async () => {
  const missing = 'ab'.repeat(32);
  assert.equal(
    await hostFor({ assetUrl: (h) => `http://wiki.test/assets/${h}` }).asset(missing),
    `http://wiki.test/assets/${missing}`
  );
  await assert.rejects(() => hostFor().asset(missing), /Missing asset: ab/);
});

test('an atlas compiled in the browser path from the zips alone equals the Node build', async () => {
  const definition = JSON.parse(
    await readFile(path.join(ROOT, 'bundles/calidor/atlas.json'), 'utf8')
  );
  const viaPacks = await compileCore(definition, hostFor());
  assert.ok(!viaPacks.html.includes('atlas-asset:'), 'every image was resolved');
  assert.match(viaPacks.html, /data:image\/[a-z]+;base64,/);
  assert.equal(viaPacks.html, (await compile(definition)).html);
  assert.ok(calidorManifest.files['atlas.json']);
});

test('an engine manifest checks the images it lists', () => {
  const engine = (assets) => ({
    bundleVersion: 1,
    type: 'engine',
    version: '1.0.0',
    kinds: ['stellar'],
    assets
  });
  const hash = 'a'.repeat(64);
  assert.deepEqual(
    validateManifest(engine({ [hash]: { file: 'assets/x.b64', mime: 'image/png' } }), [
      'bundle.json',
      'assets/x.b64'
    ]),
    []
  );
  assert.match(
    validateManifest(engine({ nothex: { file: 'assets/x.b64', mime: 'image/png' } }), [
      'bundle.json'
    ]).join(),
    /not a lowercase sha256/
  );
  assert.match(
    validateManifest(engine({ [hash]: { file: 'assets/x.b64', mime: 'text/html' } }), [
      'bundle.json',
      'assets/x.b64'
    ]).join(),
    /image mime type/
  );
  assert.match(
    validateManifest(engine({ [hash]: { file: 'assets/missing.b64', mime: 'image/png' } }), [
      'bundle.json'
    ]).join(),
    /missing file/
  );
});
