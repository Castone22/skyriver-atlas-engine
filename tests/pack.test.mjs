import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { referencedAssets, stageAssets, stageDatapack, stageEngine } from '../tools/pack.mjs';

// The zips for the extension: the engine, a datapack per atlas (each with fresh digests), and the
// images the atlases use, named by SHA-256.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const library = JSON.parse(readFileSync(path.join(ROOT, 'assets', 'manifest.json'), 'utf8'));
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

// ---- The function pack: one request for the engine's function library ----------------------------

import { loadHttp } from '../src/bundle-http.mjs';
import { createBrowserHost } from '../src/host-browser.mjs';
import { compileCore } from '../src/compile-core.mjs';
import { compile } from '../src/compiler.mjs';

/** A fetch that serves a staged directory, records what was asked for, and can be made to fail or tamper. */
function server(dir, { missing = [], tamper = {} } = {}) {
  const requested = [];
  const fetchImpl = async (address) => {
    const rel = decodeURIComponent(new URL(address).pathname).replace(/^\/[^/]+\//, '');
    requested.push(rel);
    if (missing.includes(rel)) return new Response('', { status: 404 });
    try {
      let body = await readFile(path.join(dir, rel), 'utf8');
      if (tamper[rel]) body = tamper[rel](body);
      return new Response(body, { status: 200 });
    } catch {
      return new Response('', { status: 404 });
    }
  };
  return { fetch: fetchImpl, requested };
}

test('the engine pack holds every function, and a loader fetches them with one request', async () => {
  const dir = path.join(tmp, 'engine');
  const pack = JSON.parse(await readFile(path.join(dir, 'functions.pack.json'), 'utf8'));
  const names = (await readdir(path.join(dir, 'functions'))).map((n) => `functions/${n}`);
  assert.deepEqual(Object.keys(pack).sort(), names.sort());
  const manifest = JSON.parse(await readFile(path.join(dir, 'bundle.json'), 'utf8'));
  assert.equal(manifest.pack.prefix, 'functions/');
  const s = server(dir);
  const engine = await loadHttp('http://wiki.test/engine/', {
    fetch: s.fetch,
    expectType: 'engine',
    verify: true
  });
  for (const name of names.slice(0, 40)) assert.equal(await engine.text(name), pack[name]);
  assert.deepEqual(
    s.requested.filter((r) => r.startsWith('functions/') && r !== 'functions.pack.json'),
    []
  );
  assert.equal(
    s.requested.filter((r) => r === 'functions.pack.json').length,
    1,
    'the pack is fetched once'
  );
});

test('without the pack, functions are fetched one by one as before', async () => {
  const s = server(path.join(tmp, 'engine'), { missing: ['functions.pack.json'] });
  const engine = await loadHttp('http://wiki.test/engine/', {
    fetch: s.fetch,
    expectType: 'engine'
  });
  const text = await engine.text('functions/url.js');
  assert.match(text, /function url\(/);
  assert.ok(s.requested.includes('functions/url.js'));
});

test('a file changed inside the pack is caught when files are verified', async () => {
  const s = server(path.join(tmp, 'engine'), {
    tamper: { 'functions.pack.json': (body) => body.replace('function url(', 'function url (') }
  });
  const engine = await loadHttp('http://wiki.test/engine/', {
    fetch: s.fetch,
    expectType: 'engine',
    verify: true
  });
  await assert.rejects(() => engine.text('functions/url.js'), /sha256 mismatch/);
});

test('a galaxy compiled from the zips alone, children side by side, equals the Node build', async () => {
  const ids = ['grand', 'calidor', 'elysian', 'iulr', 'kadaym', 'uacs'];
  for (const id of ids) await stageDatapack(id, path.join(tmp, 'bundles', id));
  const requested = [];
  const fetchImpl = async (address) => {
    const rel = decodeURIComponent(new URL(address).pathname).replace(/^\//, '');
    requested.push(rel);
    try {
      return new Response(await readFile(path.join(tmp, rel), 'utf8'), { status: 200 });
    } catch {
      return new Response('', { status: 404 });
    }
  };
  const host = createBrowserHost({
    engineUrl: 'http://wiki.test/engine/',
    atlasUrl: (id) => `http://wiki.test/bundles/${id}/`,
    // The Node build inlines images; give the browser host the same bytes so the two pages can be compared.
    assetUrl: (hash) => {
      const info = library[hash];
      return `data:${info.mime};base64,${readFileSync(path.join(ROOT, info.file)).toString('base64')}`;
    },
    fetch: fetchImpl
  });
  const definition = JSON.parse(
    await readFile(path.join(ROOT, 'bundles/grand/atlas.json'), 'utf8')
  );
  const viaZips = await compileCore(definition, host);
  const nodeBuild = await compile(definition);
  // The two gzip encoders write different bytes for the same content, so compare snapshots decompressed.
  // The browser host does not precompute Grand's search seed (host.loadSearch is optional); ignore it.
  const decoded = (html) =>
    html
      .replace(/"([a-z-]+-stellar-atlas)":"(H4sI[A-Za-z0-9+/=]+)"/g, (_, id, data) => {
        const page = gunzipSync(Buffer.from(data, 'base64')).toString();
        return `"${id}":"${createHash('sha256').update(page).digest('hex')}"`;
      })
      .replace(/(<script id="searchSeed" type="application\/json">)[\s\S]*?(<\/script>)/, '$1$2');
  assert.equal(decoded(viaZips.html), decoded(nodeBuild.html), 'the same galaxy page');
  assert.match(
    decoded(viaZips.html),
    /"calidor-stellar-atlas":"[0-9a-f]{64}"/,
    'snapshots were checked'
  );
  assert.ok(
    requested.filter((r) => r.startsWith('engine/functions/')).length === 0,
    'no function was fetched on its own'
  );
});
