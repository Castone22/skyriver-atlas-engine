import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdtemp, cp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Bundle, openBundle, verifyFiles, validateManifest, sha256Text } from '../src/bundle.mjs';
import { loadHttp } from '../src/bundle-http.mjs';
import { createBrowserHost, gzipBase64 } from '../src/host-browser.mjs';
import { compileCore } from '../src/compile-core.mjs';
import { compile, createNodeHost } from '../src/compiler.mjs';
import { computeFiles, updateManifest } from '../tools/bundle-manifest.mjs';
import { buildLoader, buildLoaderScript, wrapModule } from '../tools/build-loader.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

// ---- A local server standing in for the wiki extension -------------------------------------

const filesMaps = new Map();
/** The manifest the extension would serve: bundle.json plus a generated `files` map. */
async function servedManifest(dir) {
  // Read the manifest first: a missing bundle must fail here, before any hashing starts.
  const manifest = JSON.parse(await readFile(path.join(ROOT, dir, 'bundle.json'), 'utf8'));
  if (!filesMaps.has(dir)) filesMaps.set(dir, computeFiles(path.join(ROOT, dir)));
  return JSON.stringify({ ...manifest, files: await filesMaps.get(dir) });
}

const faults = { tamper: new Set(), missing: new Set() };
const requests = [];
let server;
let base;

before(async () => {
  server = http.createServer(async (req, res) => {
    requests.push(req.url);
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const raw = url.startsWith('raw/');
      const rel = raw ? url.slice(4) : url;
      if (!/^(engine|bundles)\//.test(rel) || rel.split('/').includes('..')) throw 404;
      if (faults.missing.has(rel)) throw 404;
      let body;
      if (!raw && /^(engine|bundles\/[a-z0-9_-]+)\/bundle\.json$/.test(rel))
        body = await servedManifest(path.posix.dirname(rel));
      else body = await readFile(path.join(ROOT, rel));
      if (faults.tamper.has(rel)) body = Buffer.concat([Buffer.from(body), Buffer.from(' ')]);
      res.end(body);
    } catch (e) {
      res.statusCode = e === 404 || e.code === 'ENOENT' ? 404 : 500;
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
const reset = () => {
  faults.tamper.clear();
  faults.missing.clear();
};

// ---- Purity ---------------------------------------------------------------------------------

test('new transport modules are pure: no Node imports or globals', async () => {
  for (const file of ['src/bundle-http.mjs', 'src/host-browser.mjs', 'loader/loader.mjs']) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(source, /from\s+['"]node:/, `${file} imports a Node module`);
    assert.doesNotMatch(source, /\b(?:Buffer|process|__dirname|__filename)\b|\brequire\(/, file);
  }
});

// ---- The `files` map ------------------------------------------------------------------------

const tiny = (files) =>
  Bundle.fromMap({
    'bundle.json': JSON.stringify({
      bundleVersion: 1,
      type: 'engine',
      version: '1.0.0',
      kinds: ['stellar'],
      files
    }),
    'a.txt': 'hello'
  });

test('files map: validated and verified', async () => {
  const good = await sha256Text('hello');
  const bundle = await openBundle(tiny({ 'a.txt': good }));
  assert.deepEqual(await verifyFiles(bundle), []);
  const wrong = await openBundle(tiny({ 'a.txt': 'f'.repeat(64) }));
  assert.match((await verifyFiles(wrong))[0], /a\.txt: sha256 mismatch/);
  for (const [files, pattern] of [
    [{ 'nope.txt': good }, /missing file 'nope\.txt'/],
    [{ '../x': good }, /unsafe path/],
    [{ 'a.txt': 'ABC' }, /lowercase sha256/],
    [{ 'bundle.json': good }, /must not list 'bundle\.json'/],
    [[], /must be an object/]
  ])
    assert.match(
      validateManifest(JSON.parse(await tiny(files).text('bundle.json')), [
        'bundle.json',
        'a.txt'
      ]).join(),
      pattern
    );
});

test('sha256Text matches a known digest', async () => {
  assert.equal(
    await sha256Text('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});

test('bundle-manifest tool writes, then checks, then detects drift', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'bundle-'));
  try {
    await cp(path.join(ROOT, 'bundles', 'calidor'), dir, { recursive: true });
    assert.equal((await updateManifest(dir, { check: true })).changed, true);
    assert.equal((await updateManifest(dir)).changed, true);
    assert.equal((await updateManifest(dir, { check: true })).changed, false);
    const opened = await openBundle(
      Bundle.fromMap(
        Object.fromEntries(
          await Promise.all(
            ['bundle.json', 'atlas.json', 'shell.html', 'style-0.css', 'runtime-0.js'].map(
              async (f) => [f, await readFile(path.join(dir, f), 'utf8')]
            )
          )
        )
      )
    );
    assert.deepEqual(await verifyFiles(opened), []);
    await writeFile(path.join(dir, 'style-0.css'), 'body{}');
    assert.equal((await updateManifest(dir, { check: true })).changed, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---- HTTP transport -------------------------------------------------------------------------

test('loadHttp round-trips a real bundle', async () => {
  reset();
  const bundle = await loadHttp(`${base}/bundles/calidor`, { expectType: 'atlas' });
  assert.equal(bundle.manifest.id, 'calidor');
  assert.equal(
    await bundle.text('shell.html'),
    await readFile(path.join(ROOT, 'bundles/calidor/shell.html'), 'utf8')
  );
  assert.equal((await bundle.json('atlas.json')).id, 'calidor');
  assert.deepEqual(await verifyFiles(bundle), []);
});

test('loadHttp verify mode catches a tampered file', async () => {
  reset();
  faults.tamper.add('bundles/calidor/shell.html');
  const checked = await loadHttp(`${base}/bundles/calidor/`, { verify: true });
  await assert.rejects(
    checked.text('shell.html'),
    /sha256 mismatch for http:\/\/127\.0\.0\.1:\d+\/bundles\/calidor\/shell\.html/
  );
  assert.ok((await checked.text('style-0.css')).length > 0, 'untouched files still load');
  const unchecked = await loadHttp(`${base}/bundles/calidor/`);
  assert.ok((await unchecked.text('shell.html')).endsWith(' '), 'verify is opt-in per file');
  assert.match((await verifyFiles(unchecked)).join(), /shell\.html: sha256 mismatch/);
  reset();
});

test('loadHttp errors name the URL and the status', async () => {
  reset();
  faults.missing.add('bundles/calidor/shell.html');
  const bundle = await loadHttp(`${base}/bundles/calidor/`);
  await assert.rejects(
    bundle.text('shell.html'),
    /Failed to fetch http:\/\/127\.0\.0\.1:\d+\/bundles\/calidor\/shell\.html \(HTTP 404\)/
  );
  reset();
  await assert.rejects(
    loadHttp(`${base}/bundles/nope/`),
    /bundles\/nope\/bundle\.json \(HTTP 404\)/
  );
  await assert.rejects(
    loadHttp('http://127.0.0.1:1/x/'),
    /Failed to fetch http:\/\/127\.0\.0\.1:1\/x\/bundle\.json/
  );
});

test('loadHttp rejects a bundle that does not list its files', async () => {
  reset();
  await assert.rejects(loadHttp(`${base}/raw/bundles/calidor/`), /no `files` map/);
});

test('versionParam content-addresses file URLs but not bundle.json', async () => {
  reset();
  requests.length = 0;
  const bundle = await loadHttp(`${base}/bundles/calidor/`, { versionParam: 'v' });
  const text = await bundle.text('shell.html');
  const sha = await sha256Text(text);
  assert.ok(requests.includes('/bundles/calidor/bundle.json'), 'manifest URL is unversioned');
  assert.ok(requests.includes(`/bundles/calidor/shell.html?v=${sha.slice(0, 16)}`));
});

test('gzipBase64 explains itself when CompressionStream is missing', async () => {
  const original = globalThis.CompressionStream;
  globalThis.CompressionStream = undefined;
  try {
    await assert.rejects(gzipBase64('x'), /CompressionStream is missing/);
  } finally {
    globalThis.CompressionStream = original;
  }
});

test('loadHttp fetches each file once', async () => {
  reset();
  let count = 0;
  const counting = (...args) => (count++, fetch(...args));
  const bundle = await loadHttp(`${base}/bundles/calidor/`, { fetch: counting });
  const before = count;
  await Promise.all([bundle.text('shell.html'), bundle.text('shell.html')]);
  await bundle.text('shell.html');
  assert.equal(count - before, 1);
});

// ---- Browser host ---------------------------------------------------------------------------

test('gzipBase64 produces valid gzip, including large non-ASCII text', async () => {
  const text = 'Skyriver · Σ '.repeat(20000);
  assert.equal(gunzipSync(Buffer.from(await gzipBase64(text), 'base64')).toString(), text);
});

/**
 * Honest comparison: the browser host differs from the Node host in how bundles are loaded
 * (HTTP) and how gzip is done, not in how assets are named. Asset resolution is therefore
 * delegated to the Node host so the HTML can be compared byte for byte; a real browser host
 * returns URLs instead (tested below).
 */
function browserHost(extra = {}) {
  const node = createNodeHost();
  return {
    ...createBrowserHost({
      engineUrl: `${base}/engine/`,
      atlasUrl: (id) => `${base}/bundles/${id}/`,
      assetUrl: (sha) => `${base}/assets/${sha}`
    }),
    asset: node.asset,
    ...extra
  };
}

test('compileCore over HTTP equals the Node host (calidor)', async () => {
  reset();
  const definition = JSON.parse(
    await readFile(path.join(ROOT, 'bundles/calidor/atlas.json'), 'utf8')
  );
  const viaHttp = await compileCore(definition, browserHost());
  assert.equal(viaHttp.html, (await compile(definition)).html);
});

test('a browser host returns asset URLs instead of inlining images', async () => {
  const host = createBrowserHost({
    engineUrl: `${base}/engine/`,
    atlasUrl: (id) => `${base}/bundles/${id}/`,
    assetUrl: (sha) => `${base}/assets/${sha}`
  });
  assert.equal(await host.asset('ab'.repeat(32)), `${base}/assets/${'ab'.repeat(32)}`);
  assert.equal(await host.atlas('no-such-bundle'), null, '404 means no such bundle');
  assert.equal(await host.atlas('Bad Id'), null);
  assert.equal(await host.atlas('calidor'), await host.atlas('calidor'), 'bundles are cached');
});

test('a galaxy atlas compiles over HTTP and embeds valid gzip snapshots', async () => {
  reset();
  const definition = JSON.parse(
    await readFile(path.join(ROOT, 'bundles/grand/atlas.json'), 'utf8')
  );
  const { html } = await compileCore(definition, browserHost());
  assert.ok(html.length > 1_000_000);
  const match = /"(?:elysian|kadaym)-stellar-atlas":"(H4sI[A-Za-z0-9+/=]+)"/.exec(html);
  assert.ok(match, 'a gzip snapshot is embedded');
  assert.match(gunzipSync(Buffer.from(match[1], 'base64')).toString(), /^<!doctype html>/i);
});

// ---- Loader ---------------------------------------------------------------------------------

test('the loader inlines its modules into one classic script', async () => {
  const script = await buildLoaderScript();
  assert.doesNotMatch(script, /^\s*(?:import|export)\s/m);
  assert.doesNotMatch(script, /<\/script/i);
  const page = await buildLoader();
  assert.match(page, /@@CONFIG@@/);
  assert.match(page, /@@TITLE@@/);
  assert.doesNotMatch(page, /@@LOADER@@|\{\{version/);
  assert.match(page, /skyriver-atlas-loader \d+\.\d+\.\d+/);
});

test('the module inliner rejects forms it cannot handle', () => {
  assert.throws(() => wrapModule('a.mjs', "import x from './b.mjs';"), /named imports/);
  assert.throws(() => wrapModule('a.mjs', 'export default 1;'), /unsupported import\/export/);
  assert.throws(() => wrapModule('a.mjs', 'export { a };'), /unsupported import\/export/);
  const { code, deps } = wrapModule(
    'src/a.mjs',
    "import { x as y, z } from './b.mjs';\nexport const q = y + z;\nexport async function f() {}"
  );
  assert.deepEqual(deps, ['src/b.mjs']);
  assert.match(code, /const \{ x: y, z \} = __mods\["src\/b\.mjs"\];/);
  assert.match(code, /return \{ q, f \};/);
});

test('the built loader renders an atlas in place and keeps the deep-link query', async () => {
  reset();
  const config = {
    atlas: 'calidor',
    engineUrl: `${base}/engine/`,
    bundlesUrl: `${base}/bundles/`,
    assetsUrl: `${base}/assets/`
  };
  const page = (await buildLoader())
    .replace('@@TITLE@@', 'Loading')
    .replace('@@CONFIG@@', JSON.stringify(config).replace(/</g, '\\u003c'));
  const virtualConsole = new VirtualConsole(); // atlas scripts need canvas mocks; not under test
  const dom = new JSDOM(page, {
    url: 'https://wiki.example/Special:AtlasEmbed/calidor?system=Virezk&planet=Mahanzk',
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      window.fetch = (...args) => fetch(...args);
    }
  });
  const { window } = dom;
  const deadline = Date.now() + 30_000;
  while (!window.document.title.includes('Dominion of Calidor') && Date.now() < deadline)
    await new Promise((r) => setTimeout(r, 50));
  assert.match(window.document.title, /Dominion of Calidor/);
  assert.equal(window.location.search, '?system=Virezk&planet=Mahanzk');
  window.close();
});

test('the built loader reports a missing atlas in the page', async () => {
  reset();
  const config = {
    atlas: 'nope',
    engineUrl: `${base}/engine/`,
    bundlesUrl: `${base}/bundles/`,
    assetsUrl: `${base}/assets/`
  };
  const page = (await buildLoader())
    .replace('@@TITLE@@', 'x')
    .replace('@@CONFIG@@', JSON.stringify(config));
  const dom = new JSDOM(page, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      window.fetch = (...args) => fetch(...args);
    }
  });
  const { window } = dom;
  const deadline = Date.now() + 10_000;
  const status = () => window.document.getElementById('status').textContent;
  while (!/Could not load/.test(status()) && Date.now() < deadline)
    await new Promise((r) => setTimeout(r, 50));
  assert.match(status(), /Could not load this atlas: atlas bundle 'nope' was not found/);
  window.close();
});
