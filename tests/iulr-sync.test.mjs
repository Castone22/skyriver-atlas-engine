// Read-only, deterministic MediaWiki API fixtures. No live article creation or rename.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
const root = new URL('../', import.meta.url),
  read = (p) => readFile(new URL(p, root), 'utf8');
let runtime = await read('engine/profiles/iulr/runtime-0.js');
for (const m of [...runtime.matchAll(/\/\* @atlas-function ([\w-]+) \*\//g)].reverse())
  runtime =
    runtime.slice(0, m.index) +
    (await read('engine/functions/' + m[1] + '.js')) +
    runtime.slice(m.index + m[0].length);
const sync = runtime.slice(
  runtime.indexOf('// Planet article title sync:'),
  runtime.indexOf('function resolveRegion(')
);
const cacheKey = 'skyriver-iulr-planet-articles-v1';
const page = (title, pageid = 42) => ({ title, pageid, ns: 0 });
function fixture({
  worlds = { Alpha: { name: 'Alpha', articleTitle: 'Alpha' }, Beta: { name: 'Beta' } },
  cache = null,
  storageThrows = false,
  fetcher
} = {}) {
  const calls = [],
    writes = [],
    redraws = [];
  const DATA = { worlds };
  let fetchImpl = fetcher || (() => ({ pages: [] }));
  const ctx = vm.createContext({
    DATA,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    document: { hidden: false },
    Date,
    console,
    localStorage: {
      getItem() {
        if (storageThrows) throw Error('unavailable');
        return typeof cache === 'string' ? cache : JSON.stringify(cache);
      },
      setItem(key, value) {
        if (storageThrows) throw Error('unavailable');
        writes.push({ key, value });
      }
    },
    fetch: async (url, options) => {
      const q = new URL(url).searchParams;
      calls.push({ q, options });
      const value = await fetchImpl(q, options);
      return {
        ok: value.ok !== false,
        json: async () =>
          value.error ? { error: value.error } : value.invalid ? {} : { query: value }
      };
    },
    canonicalTitle: (name) => DATA.worlds[name]?.articleTitle || name,
    draw: () => redraws.push('draw'),
    scaleLabels: () => redraws.push('scaleLabels'),
    renderIndex: () => redraws.push('renderIndex'),
    renderDetail: () => redraws.push('renderDetail')
  });
  vm.runInContext(sync, ctx);
  const run = (source) => vm.runInContext(source, ctx);
  return {
    ctx,
    run,
    calls,
    writes,
    redraws,
    DATA,
    setFetch: (f) => (fetchImpl = f),
    sync: (force = true) => run(`syncPlanetArticleTitles(${force})`),
    name: (n) => run(`planetDisplayName(${JSON.stringify(n)})`)
  };
}
test('IULR: absent articles retain original names and do not mutate the catalogue', async () => {
  const f = fixture({ fetcher: () => ({ pages: [{ title: 'Alpha', missing: true, ns: 0 }] }) }),
    before = JSON.stringify(f.DATA);
  await f.sync();
  assert.equal(f.name('Alpha'), 'Alpha');
  assert.equal(f.name('Beta'), 'Beta');
  assert.equal(f.run('planetArticleIDs.size'), 0);
  assert.equal(JSON.stringify(f.DATA), before);
  assert.equal(f.redraws.length, 0);
});
test('IULR: a newly created article resolves canonical names and persists browser cache', async () => {
  const f = fixture({
    fetcher: () => ({
      normalized: [{ from: 'Alpha', to: 'Alpha Canonical' }],
      pages: [page('Alpha Canonical')]
    })
  });
  await f.sync();
  assert.equal(f.name('Alpha'), 'Alpha Canonical');
  assert.equal(f.run('planetArticleIDs.get("Alpha")'), 42);
  assert.equal(f.writes[0].key, cacheKey);
  assert.deepEqual(JSON.parse(f.writes[0].value), {
    ids: { Alpha: 42 },
    names: { Alpha: 'Alpha Canonical' }
  });
  assert.deepEqual(f.redraws, ['draw', 'scaleLabels', 'renderIndex', 'renderDetail']);
});
test('IULR: normalization and multi-hop redirects map unordered results to stable names', async () => {
  const f = fixture({
    worlds: { Alpha: { articleTitle: 'Alpha_old' }, Beta: {} },
    fetcher: () => ({
      normalized: [{ from: 'Alpha_old', to: 'Alpha old' }],
      redirects: [
        { from: 'Alpha old', to: 'First Move' },
        { from: 'First Move', to: 'Final Name' }
      ],
      pages: [page('Beta', 91), page('Final Name', 42)]
    })
  });
  await f.sync();
  assert.equal(f.name('Alpha'), 'Final Name');
  assert.equal(f.name('Beta'), 'Beta');
  assert.equal(f.run('planetArticleIDs.get("Beta")'), 91);
});
test('IULR: cached page ID follows a no-redirect rename and rejects old-name recreation', async () => {
  const f = fixture({
    cache: { ids: { Alpha: 42 }, names: { Alpha: 'First Name' } },
    fetcher: (q) =>
      q.has('pageids') ? { pages: [page('Moved Again', 42)] } : { pages: [page('Alpha', 99)] }
  });
  await f.sync();
  assert.equal(f.calls[0].q.get('pageids'), '42');
  assert.equal(f.calls[1].q.get('titles'), 'Alpha|Beta');
  assert.equal(f.name('Alpha'), 'Moved Again');
  assert.equal(f.run('planetArticleIDs.get("Alpha")'), 42);
});
test('IULR: offline and deleted cached pages retain the last known label and identity', async () => {
  const f = fixture({
    cache: { ids: { Alpha: 42 }, names: { Alpha: 'Saved Name' } },
    fetcher: () => {
      throw Error('offline');
    }
  });
  await f.sync();
  assert.equal(f.name('Alpha'), 'Saved Name');
  assert.equal(f.name('Beta'), 'Beta');
  assert.equal(f.run('planetTitleLastChecked'), 0);
  f.setFetch((q) =>
    q.has('pageids') ? { pages: [{ pageid: 42, missing: true }] } : { pages: [page('Alpha', 99)] }
  );
  await f.sync();
  assert.equal(f.name('Alpha'), 'Saved Name');
  assert.equal(f.run('planetArticleIDs.get("Alpha")'), 42);
});
test('IULR: malformed or unavailable localStorage never prevents synchronization', async () => {
  for (const option of [{ cache: '{broken' }, { storageThrows: true }]) {
    const f = fixture({
      ...option,
      fetcher: () => ({
        redirects: [{ from: 'Alpha', to: 'New Alpha' }],
        pages: [page('New Alpha')]
      })
    });
    await f.sync();
    assert.equal(f.name('Alpha'), 'New Alpha');
  }
});
test('IULR: title discovery ignores missing pages and non-article namespaces', async () => {
  const f = fixture({
    fetcher: () => ({
      pages: [
        { title: 'Alpha', ns: 1, pageid: 12 },
        { title: 'Beta', ns: 0, missing: true }
      ]
    })
  });
  await f.sync();
  assert.equal(f.run('planetArticleIDs.size'), 0);
  assert.equal(f.name('Alpha'), 'Alpha');
});
test('IULR: 40-name chunks keep successful batches when another batch fails', async () => {
  const worlds = Object.fromEntries(Array.from({ length: 45 }, (_, i) => ['World ' + i, {}]));
  const f = fixture({
    worlds,
    fetcher: (q) => {
      const titles = q.get('titles').split('|');
      if (titles.includes('World 40')) throw Error('one batch failed');
      return {
        redirects: [{ from: 'World 0', to: 'Discovered Zero' }],
        pages: [page('Discovered Zero')]
      };
    }
  });
  await f.sync();
  assert.deepEqual(
    f.calls.map((x) => x.q.get('titles').split('|').length),
    [40, 5]
  );
  assert.equal(f.name('World 0'), 'Discovered Zero');
  assert.equal(f.name('World 40'), 'World 40');
});
test('IULR: hidden tabs skip requests, concurrent refreshes deduplicate, normal polling throttles', async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  const f = fixture({
    fetcher: async () => {
      await gate;
      return { pages: [] };
    }
  });
  f.ctx.document.hidden = true;
  await f.sync();
  assert.equal(f.calls.length, 0);
  f.ctx.document.hidden = false;
  const a = f.sync(),
    b = f.sync();
  await new Promise((r) => setImmediate(r));
  release();
  assert.equal(f.calls.length, 1);
  await Promise.all([a, b]);
  await f.sync(false);
  assert.equal(f.calls.length, 1);
  await f.sync(true);
  assert.equal(f.calls.length, 2);
});
test('IULR: MediaWiki requests retain read-only CORS and cache options', async () => {
  const f = fixture();
  await f.sync();
  const { q, options } = f.calls[0];
  assert.equal(q.get('action'), 'query');
  assert.equal(q.get('prop'), 'info');
  assert.equal(q.get('formatversion'), '2');
  assert.equal(q.has('origin'), false);
  assert.equal(q.has('crossorigin'), true);
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.mode, 'cors');
  assert(options.signal instanceof AbortSignal);
});
test('IULR: failed HTTP, API errors and malformed responses preserve fallback names', async () => {
  for (const response of [{ ok: false }, { error: { code: 'badrequest' } }, { invalid: true }]) {
    const f = fixture({ fetcher: () => response });
    await f.sync();
    assert.equal(f.name('Alpha'), 'Alpha');
    assert.equal(f.run('planetTitleLastChecked'), 0);
  }
});
test('IULR: rebuilt atlas and Grand snapshot contain the identical synchronized runtime', async () => {
  const html = await read('dist/iulr-atlas.html'),
    grand = await read('dist/grand-atlas.html');
  const snapshots = JSON.parse(
    grand.match(/<script[^>]*id="snapshots"[^>]*>([\s\S]*?)<\/script>/)[1]
  );
  assert.equal(gunzipSync(Buffer.from(snapshots['iulr-stellar-atlas'], 'base64')).toString(), html);
  for (const name of [
    'planetDisplayName',
    'planetArticleIDs',
    'planetResolvedTitles',
    'syncPlanetArticleTitles',
    'triggerPlanetTitleCheck',
    'PLANET_TITLE_REFRESH_MS'
  ])
    assert(html.includes(name), name);
  assert.match(html, /IULR Stellar Atlas v\.9/);
  assert.match(html, /"edition":9/);
  assert.doesNotMatch(html, /@atlas-function|@@RUNTIME/);
});
test('IULR: a direct Grand build refreshes its child without precompiled dependencies', async () => {
  const { compile } = await import('../src/compiler.mjs');
  const definition = JSON.parse(await read('data/grand.json'));
  const { html } = await compile(definition);
  const snapshots = JSON.parse(
    html.match(/<script[^>]*id="snapshots"[^>]*>([\s\S]*?)<\/script>/)[1]
  );
  assert.equal(
    gunzipSync(Buffer.from(snapshots['iulr-stellar-atlas'], 'base64')).toString(),
    await read('dist/iulr-atlas.html')
  );
});
