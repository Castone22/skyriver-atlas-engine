// Actual rebuilt document in JSDOM with the same canvas/SVG mocks as the full DOM suite.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { open } = require('./dom.cjs');
const root = path.resolve(__dirname, '..'),
  html = fs.readFileSync(path.join(root, 'dist/iulr-atlas.html'), 'utf8'),
  results = [];
const cacheKey = 'atlas-planet-articles-v1:iulr',
  planet = 'New Avendon';
const tick = () => new Promise((r) => setTimeout(r, 15));
function fixture(w, state) {
  w.fetch = async (url) => {
    const q = new URL(url).searchParams;
    if (q.get('prop') !== 'info') throw Error('Offline image test');
    state.calls.push(q);
    if (state.offline) throw Error('Offline title test');
    let pages = [],
      redirects = [];
    if (q.has('pageids') && q.get('pageids').split('|').includes('42'))
      pages = [{ title: state.title, pageid: 42, ns: 0 }];
    else if (q.has('titles') && q.get('titles').split('|').includes(planet) && state.created) {
      if (state.recreated) pages = [{ title: planet, pageid: 99, ns: 0 }];
      else {
        pages = [{ title: state.title, pageid: 42, ns: 0 }];
        redirects = [{ from: planet, to: state.title }];
      }
    }
    return { ok: true, json: async () => ({ query: { pages, redirects } }) };
  };
}
function passed(name) {
  results.push({ name, passed: true });
  console.log('PASS IULR DOM', name);
}
(async () => {
  let cached;
  const state = { calls: [], created: false, title: planet };
  const { w, errors } = open(html, 'iulr', (win) => {
    fixture(win, state);
    win.__intervals = [];
    win.setInterval = (fn, delay) => {
      win.__intervals.push({ fn, delay });
      return 1;
    };
  });
  try {
    await tick();
    await w.eval('syncPlanetTitles.state?.request');
    const api = w.AtlasFramework,
      system = w.eval(`DATA.systems.find(s=>s.worlds.includes(${JSON.stringify(planet)})).id`);
    const original = JSON.stringify(api.exportJSON());
    assert.equal(w.eval(`planetName(${JSON.stringify(planet)})`), planet);
    assert.equal(w.eval('Object.keys(DATA.planetArticles||{}).length'), 0);
    passed('missing articles retain atlas names');
    api.navigate({ system, planet });
    const before = JSON.stringify(
      w.eval(
        '({selected,selectedWorld,planetFocus,systemFocused,systemZoom,vb,view,highlightedRegion})'
      )
    );
    const address = w.location.href;
    state.created = true;
    state.title = 'Renamed Avendon';
    await w.eval('syncPlanetTitles(true)');
    assert.equal(w.document.querySelector('#detail h2').textContent, state.title);
    assert.equal(
      w.document.querySelector('#detail .codex-button').textContent,
      'Open ' + state.title + ' in Codex ↗'
    );
    assert.equal(new URL(api.articleURL(planet)).searchParams.get('curid'), '42');
    assert.equal(
      w.eval(`currentImageTitle(DATA.worlds[${JSON.stringify(planet)}],${JSON.stringify(planet)})`),
      state.title
    );
    assert(w.document.querySelector('#orbitDiagram').textContent.includes(state.title));
    passed('canonical title reaches dossier, orbit labels, article links and image lookup');
    assert.equal(
      JSON.stringify(
        w.eval(
          '({selected,selectedWorld,planetFocus,systemFocused,systemZoom,vb,view,highlightedRegion})'
        )
      ),
      before
    );
    assert.equal(w.location.href, address);
    assert.equal(JSON.stringify(api.exportJSON()), original);
    passed('rename preserves focused planet, camera, zoom, URL and exported catalogue');
    w.document.getElementById('search').value = state.title;
    w.eval('renderIndex()');
    assert(w.document.getElementById('index').textContent.includes(state.title));
    assert.equal(
      w.eval(`resolveObjectName(resolveSystem(${JSON.stringify(system)}),'Renamed Avendon')`),
      planet
    );
    api.navigate({ planet: state.title });
    assert.equal(w.eval('planetFocus'), planet);
    passed('renamed search and routes resolve the original stable planet key');
    state.title = 'Avendon Without Redirect';
    state.recreated = true;
    const previous = state.calls.length;
    await w.eval('syncPlanetTitles(true)');
    assert.equal(state.calls[previous].get('pageids'), '42');
    assert.equal(w.eval(`planetName(${JSON.stringify(planet)})`), state.title);
    assert.equal(new URL(api.articleURL(planet)).searchParams.get('curid'), '42');
    passed('cached page ID tracks a move without redirect and rejects old-title recreation');
    state.title = 'Avendon After Focus';
    w.dispatchEvent(new w.Event('focus'));
    await tick();
    await w.eval('syncPlanetTitles.state?.request');
    assert.equal(w.document.querySelector('#detail h2').textContent, state.title);
    state.title = 'Avendon After Online';
    w.dispatchEvent(new w.Event('online'));
    await tick();
    await w.eval('syncPlanetTitles.state?.request');
    assert.equal(w.document.querySelector('#detail h2').textContent, state.title);
    Object.defineProperty(w.document, 'hidden', { configurable: true, value: true });
    const hiddenCalls = state.calls.length;
    w.dispatchEvent(new w.Event('focus'));
    await tick();
    assert.equal(state.calls.length, hiddenCalls);
    Object.defineProperty(w.document, 'hidden', { configurable: true, value: false });
    state.title = 'Avendon Visible Again';
    w.document.dispatchEvent(new w.Event('visibilitychange'));
    await tick();
    await w.eval('syncPlanetTitles.state?.request');
    assert.equal(w.document.querySelector('#detail h2').textContent, state.title);
    passed('focus, online and visible-again refresh; hidden tabs stay quiet');
    state.title = 'Avendon Periodic';
    w.eval('syncPlanetTitles.state.checked=0');
    w.eval('syncPlanetTitles()');
    await tick();
    await w.eval('syncPlanetTitles.state?.request');
    assert.equal(w.document.querySelector('#detail h2').textContent, state.title);
    Object.defineProperty(w.document, 'hidden', { configurable: true, value: true });
    const timerCalls = state.calls.length;
    w.eval('syncPlanetTitles.state.checked=0');
    w.eval('syncPlanetTitles()');
    await tick();
    assert.equal(state.calls.length, timerCalls);
    Object.defineProperty(w.document, 'hidden', { configurable: true, value: false });
    passed('the periodic check refreshes visible tabs only');
    const refresh = w.document.getElementById('refreshArticleData');
    assert(refresh, 'Refresh data control');
    state.title = 'Avendon Manual Refresh';
    refresh.click();
    await tick();
    await w.eval('syncPlanetTitles.state?.request');
    assert.equal(w.document.querySelector('#detail h2').textContent, state.title);
    cached = w.localStorage.getItem(cacheKey);
    assert.equal(JSON.parse(cached)[planet].title, state.title);
    passed('Refresh data updates title and persists cache');
    assert.deepEqual(errors, []);
    await tick();
  } finally {
    w.close();
  }
  const reload = open(html, 'iulr-offline', (win) => {
    win.localStorage.setItem(cacheKey, cached);
  });
  try {
    await tick();
    await reload.w.eval('syncPlanetTitles.state?.request');
    assert.equal(reload.w.eval(`planetName(${JSON.stringify(planet)})`), 'Avendon Manual Refresh');
    assert.deepEqual(reload.errors, []);
    passed('offline reload retains cached canonical title without runtime errors');
  } finally {
    reload.w.close();
  }
  const widget = open(html, 'iulr-widget?planet=New%20Avendon&view=widget', (win) =>
    win.localStorage.setItem(cacheKey, cached)
  );
  try {
    await tick();
    await widget.w.eval('syncPlanetTitles.state?.request');
    assert(widget.w.eval('widgetMode'));
    const anchor = widget.w.document.querySelector('[data-local-center="New Avendon"]');
    assert.equal(anchor.tagName.toLowerCase(), 'a');
    assert.equal(new URL(anchor.getAttribute('href')).searchParams.get('curid'), '42');
    assert.equal(anchor.getAttribute('target'), '_blank');
    assert.deepEqual(widget.errors, []);
    passed('widget planet symbol links to the canonical renamed article');
  } finally {
    widget.w.close();
  }
  fs.writeFileSync(
    path.join(root, 'docs/iulr-dom-results.json'),
    JSON.stringify(
      {
        method:
          'JSDOM with mocked canvas/SVG geometry and read-only MediaWiki fixtures; not visual or live API verification',
        results
      },
      null,
      2
    ) + '\n'
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
