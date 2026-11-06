// How an atlas learns what the wiki calls its bodies. The wiki is a deterministic fixture: nothing is
// created or renamed on the live wiki.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { render } from '../src/template.mjs';

const root = new URL('../', import.meta.url),
  read = (p) => readFile(new URL(p, root), 'utf8');
const WIKI = 'https://wiki.test';
const FUNCTIONS = [
  'planetKey',
  'planetName',
  'planetArticle',
  'planetAliases',
  'planetNameMarkup',
  'canonicalTitle',
  'url',
  'rememberPlanetArticle',
  'restorePlanetArticles',
  'savePlanetArticles',
  'acceptPlanetTitleBatch',
  'syncPlanetTitles'
];
let source = '';
for (const name of FUNCTIONS)
  source += render(await read(`engine/functions/${name}.js`), { wikiBase: WIKI }, name) + '\n';

const cacheKey = 'atlas-planet-articles-v1:test';
const page = (title, pageid = 42, extra = {}) => ({ title, pageid, ns: 0, ...extra });

function fixture({
  worlds = { Alpha: { articleTitle: 'Alpha' }, Beta: {} },
  cache = null,
  storageThrows = false,
  fetcher = () => ({ pages: [] })
} = {}) {
  const calls = [],
    writes = [],
    redraws = [];
  let fetchImpl = fetcher;
  const DATA = { worlds, systems: [], stations: [], satellites: [], entities: [], regions: {} };
  const ctx = vm.createContext({
    DATA,
    __ATLAS__: { id: 'test' },
    URL,
    URLSearchParams,
    AbortController,
    // The sync schedules its next check a minute ahead; do not let that keep the test process alive.
    setTimeout: (fn, ms) => setTimeout(fn, ms).unref(),
    clearTimeout,
    Date,
    console,
    document: { hidden: false },
    allRecords: [],
    referenceTargets: new Map(),
    selected: null,
    esc: (s) => String(s),
    normalizedName: (v) =>
      String(v || '')
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),
    atlasParams: () => new URLSearchParams(''),
    restoreRoute: () => redraws.push('restoreRoute'),
    refreshPlanetTitleUI: () => redraws.push('redraw'),
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
    fetch: async (address, options) => {
      const q = new URL(address).searchParams;
      calls.push({ q, options, address });
      const value = await fetchImpl(q, options);
      return {
        ok: value.ok !== false,
        json: async () =>
          value.error ? { error: value.error } : value.invalid ? {} : { query: value }
      };
    }
  });
  vm.runInContext(source, ctx);
  const run = (code) => vm.runInContext(code, ctx);
  return {
    ctx,
    run,
    calls,
    writes,
    redraws,
    DATA,
    setFetch: (f) => (fetchImpl = f),
    sync: (force = true) => run(`syncPlanetTitles(${force})`),
    name: (n) => run(`planetName(${JSON.stringify(n)})`),
    url: (n) => run(`url(${JSON.stringify(n)})`),
    article: (k) => DATA.planetArticles?.[k]
  };
}

test('an absent article leaves the names and the data alone', async () => {
  const f = fixture({ fetcher: () => ({ pages: [{ title: 'Alpha', missing: true, ns: 0 }] }) }),
    before = JSON.stringify(f.DATA);
  await f.sync();
  assert.equal(f.name('Alpha'), 'Alpha');
  assert.equal(f.name('Beta'), 'Beta');
  assert.equal(JSON.stringify(f.DATA.planetArticles || {}), '{}');
  assert.equal(f.redraws.length, 0);
  assert.equal(JSON.stringify({ ...f.DATA, planetArticles: undefined }), before);
});

test('a moved article becomes the name, is remembered, and is linked by page id', async () => {
  const f = fixture({
    fetcher: () => ({
      normalized: [{ from: 'Alpha', to: 'Alpha Canonical' }],
      pages: [page('Alpha Canonical')]
    })
  });
  await f.sync();
  assert.equal(f.name('Alpha'), 'Alpha Canonical');
  assert.equal(f.article('Alpha').pageid, 42);
  assert.equal(f.url('Alpha'), WIKI + '/index.php?curid=42');
  assert.equal(f.writes.at(-1).key, cacheKey);
  assert.equal(JSON.parse(f.writes.at(-1).value).Alpha.title, 'Alpha Canonical');
  assert.deepEqual(f.redraws, ['redraw']);
});

test('multi-hop redirects and normalised titles resolve to the stable names', async () => {
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
  assert.equal(f.article('Beta').pageid, 91);
});

test('the page title shown is the article display title, without markup', async () => {
  const f = fixture({
    fetcher: () => ({
      redirects: [{ from: 'Alpha', to: 'Aurelia' }],
      pages: [page('Aurelia', 42, { displaytitle: '<i>Aurelia</i> &amp; Sons' })]
    })
  });
  await f.sync();
  assert.equal(f.name('Alpha'), 'Aurelia & Sons');
  assert.equal(f.article('Alpha').title, 'Aurelia');
  assert.equal(f.calls[0].q.get('inprop'), 'displaytitle');
});

test('old titles keep finding the planet', async () => {
  const f = fixture({
    fetcher: () => ({ redirects: [{ from: 'Alpha', to: 'First' }], pages: [page('First')] })
  });
  await f.sync();
  assert.equal(f.run('planetKey("First")'), 'Alpha');
  assert.equal(f.run('planetKey("Alpha")'), 'Alpha');
  // moved again: the page id is asked for, and the earlier title becomes an alias
  f.setFetch((q) => ({ pages: [page('Second', Number(q.get('pageids')))] }));
  await f.sync();
  assert.equal(f.name('Alpha'), 'Second');
  assert.deepEqual([...f.run('planetAliases("Alpha")')].sort(), ['First', 'Second']);
  assert.equal(f.run('planetKey("First")'), 'Alpha');
  assert.equal(f.run('planetKey("Second")'), 'Alpha');
});

test('a planet with its default name is claimed by creating a redirect', async () => {
  const f = fixture({
    worlds: { 'Foobiar I': { articleTitle: 'Foobiar I' } },
    fetcher: () => ({ pages: [{ title: 'Foobiar I', missing: true, ns: 0 }] })
  });
  await f.sync();
  // no article yet: shown and linked by the default name
  assert.equal(f.name('Foobiar I'), 'Foobiar I');
  assert.equal(f.url('Foobiar I'), WIKI + '/index.php?title=Foobiar_I');
  // someone creates the redirect Foobiar I -> Aurelia
  f.setFetch(() => ({
    redirects: [{ from: 'Foobiar I', to: 'Aurelia' }],
    pages: [page('Aurelia', 77)]
  }));
  await f.sync();
  assert.equal(f.name('Foobiar I'), 'Aurelia');
  assert.equal(f.url('Foobiar I'), WIKI + '/index.php?curid=77');
  // from then on the page id drives the name, even if the redirect is deleted and the page moves again
  f.setFetch((q) => {
    assert.equal(q.get('pageids'), '77');
    return { pages: [page('Aurelia Prime', 77)] };
  });
  await f.sync();
  assert.equal(f.name('Foobiar I'), 'Aurelia Prime');
  assert.equal(f.run('planetKey("Aurelia")'), 'Foobiar I');
});

test('a remembered page id is asked for by id, and an article recreated at the old title is ignored', async () => {
  const f = fixture({
    cache: { Alpha: { title: 'First Name', pageid: 42 } },
    fetcher: (q) =>
      q.has('pageids') ? { pages: [page('Moved Again', 42)] } : { pages: [page('Beta', 5)] }
  });
  f.run('restorePlanetArticles()');
  await f.sync();
  assert.equal(f.calls[0].q.get('pageids'), '42');
  assert.equal(f.calls[1].q.get('titles'), 'Beta');
  assert.equal(f.name('Alpha'), 'Moved Again');
  assert.equal(f.article('Alpha').pageid, 42);
});

test('offline, and a deleted remembered page, keep the last known name', async () => {
  const f = fixture({
    cache: { Alpha: { title: 'Saved Name', pageid: 42 } },
    fetcher: () => {
      throw Error('offline');
    }
  });
  f.run('restorePlanetArticles()');
  await f.sync();
  assert.equal(f.name('Alpha'), 'Saved Name');
  assert.equal(f.name('Beta'), 'Beta');
  f.setFetch((q) =>
    q.has('pageids') ? { pages: [{ pageid: 42, missing: true }] } : { pages: [page('Beta', 5)] }
  );
  await f.sync();
  assert.equal(f.name('Alpha'), 'Saved Name');
  assert.equal(f.article('Alpha').pageid, 42);
});

test('broken or unavailable storage never stops synchronisation', async () => {
  for (const option of [{ cache: '{broken' }, { storageThrows: true }]) {
    const f = fixture({
      ...option,
      fetcher: () => ({
        redirects: [{ from: 'Alpha', to: 'New Alpha' }],
        pages: [page('New Alpha')]
      })
    });
    f.run('restorePlanetArticles()');
    await f.sync();
    assert.equal(f.name('Alpha'), 'New Alpha');
  }
});

test('missing pages and other namespaces are ignored', async () => {
  const f = fixture({
    fetcher: () => ({
      pages: [
        { title: 'Alpha', ns: 1, pageid: 12 },
        { title: 'Beta', ns: 0, missing: true }
      ]
    })
  });
  await f.sync();
  assert.equal(JSON.stringify(f.DATA.planetArticles || {}), '{}');
  assert.equal(f.name('Alpha'), 'Alpha');
});

test('requests go out in 40-name batches, and a failed batch does not stop the others', async () => {
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
    f.calls.map((x) => x.q.get('titles').split('|').length).sort((a, b) => b - a),
    [40, 5]
  );
  assert.equal(f.name('World 0'), 'Discovered Zero');
  assert.equal(f.name('World 40'), 'World 40');
});

test('a hidden tab asks nothing, concurrent syncs share one request, ordinary polling is throttled', async () => {
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
  clearTimeout(f.run('syncPlanetTitles.state.timer'));
});

test('requests are read-only, cross-origin and uncached, to the configured wiki', async () => {
  const f = fixture();
  await f.sync();
  const { q, options, address } = f.calls[0];
  assert.ok(address.startsWith(WIKI + '/api.php?'));
  assert.equal(q.get('action'), 'query');
  assert.equal(q.get('prop'), 'info');
  assert.equal(q.get('formatversion'), '2');
  assert.equal(q.has('origin'), false);
  assert.equal(q.has('crossorigin'), true);
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.mode, 'cors');
  assert(options.signal instanceof AbortSignal);
  clearTimeout(f.run('syncPlanetTitles.state.timer'));
});

test('a failed request, an API error and a malformed response keep the names', async () => {
  for (const response of [{ ok: false }, { error: { code: 'badrequest' } }, { invalid: true }]) {
    const f = fixture({ fetcher: () => response });
    await f.sync();
    assert.equal(f.name('Alpha'), 'Alpha');
    clearTimeout(f.run('syncPlanetTitles.state.timer'));
  }
});

test('every atlas, and a Grand snapshot, carry the same lookup', async () => {
  const grand = await read('dist/grand-atlas.html');
  const snapshots = JSON.parse(
    grand.match(/<script[^>]*id="snapshots"[^>]*>([\s\S]*?)<\/script>/)[1]
  );
  for (const id of ['calidor', 'elysian', 'iulr', 'kadaym', 'uacs']) {
    const html = await read(`dist/${id}-atlas.html`);
    for (const name of ['planetKey', 'planetName', 'syncPlanetTitles', 'startPlanetTitleSync'])
      assert.ok(html.includes(`function ${name}(`), `${id} lacks ${name}`);
    const snapshot = snapshots[`${id}-stellar-atlas`];
    if (snapshot) assert.equal(gunzipSync(Buffer.from(snapshot, 'base64')).toString(), html);
  }
});
