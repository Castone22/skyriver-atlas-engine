// Browser regressions use offline network conditions, so API outages cannot mask local errors.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'),
  workspace = path.dirname(root),
  results = [];
const server = http.createServer((req, res) => {
  let p = path.join(workspace, decodeURIComponent(new URL(req.url, 'http://local').pathname));
  try {
    res.setHeader('Content-Type', p.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(fs.readFileSync(p));
  } catch {
    res.writeHead(404);
    res.end('missing');
  }
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port,
    browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.CHROMIUM_PATH ||
        (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
      args: ['--no-sandbox', '--enable-unsafe-swiftshader']
    });
  try {
    for (const id of [
      'calidor',
      'elysian',
      'iulr',
      'kadaym',
      'uacs',
      'dsl-demo',
      'mahanzk',
      'grand'
    ]) {
      const page = await browser.newPage({
          viewport: { width: 1440, height: 900 },
          reducedMotion: 'reduce'
        }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/*', (route) =>
        route.request().url().startsWith(origin) ? route.continue() : route.abort()
      );
      await page.goto(
        origin +
          '/' +
          encodeURIComponent(path.basename(root)) +
          '/dist/' +
          id +
          '-atlas.html' +
          (id === 'mahanzk' ? '?view=surface' : '')
      );
      await page.waitForTimeout(350);
      if (!['mahanzk', 'grand'].includes(id)) {
        const state = await page.evaluate(() => ({
          count: DATA.systems.length,
          options: [...document.querySelectorAll('#regionPicker option, #regionSelect option')].map(
            (x) => x.value
          ),
          regions: Object.keys(DATA.regions),
          api: !!window.AtlasFramework,
          body: document.body.innerText.slice(0, 90)
        }));
        assert(state.api, id + ' host API');
        assert.equal(state.options.length, state.regions.length + 1, id + ' dropdown');
        const target = await page.evaluate(() =>
          DATA.systems.find((s) => s.worlds?.some((n) => DATA.worlds[n]?.bodyType !== 'Moon'))
        );
        await page.evaluate((s) => window.AtlasFramework.navigate({ system: s.id }), target);
        await page.waitForTimeout(200);
        let focused = await page.evaluate(() => ({ systemFocused, selected, planetFocus }));
        assert.equal(focused.systemFocused, true, id + ' system view');
        assert.equal(focused.selected, target.id);
        const world = target.worlds.find(Boolean);
        await page.evaluate(
          ({ s, w }) => window.AtlasFramework.navigate({ system: s.id, planet: w }),
          { s: target, w: world }
        );
        await page.waitForTimeout(200);
        focused = await page.evaluate(() => ({ systemFocused, selected, planetFocus }));
        assert(focused.planetFocus, id + ' planet view');
        await page.evaluate(() => window.AtlasFramework.navigate({ region: 'all' }));
        await page.waitForTimeout(100);
        const exported = await page.evaluate(() => window.AtlasFramework.exportJSON());
        assert.equal(exported.id, id);
        assert.equal(exported.data.systems.length, state.count);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(180);
        assert(await page.locator('#map').isVisible(), id + ' mobile map');
        results.push({ id, ...state, system: target.id, planet: world, mobile: true, errors });
      } else if (id === 'mahanzk') {
        const state = await page.evaluate(() => ({
          places: places.length,
          zoom: Math.round((scale / fitScale) * 100),
          surface: p
        }));
        assert.equal(state.zoom, 100);
        assert.equal(state.surface, 1);
        await page.evaluate(() => focusPlace(places[0]));
        assert(await page.locator('#detail').isVisible());
        results.push({ id, ...state, errors });
      } else {
        const rows = await page.locator('#indexList .index-row').count();
        assert.equal(rows, 5);
        await page.locator('#search').fill('Mahanzk');
        await page.waitForTimeout(300);
        assert((await page.locator('#indexList').innerText()).includes('Mahanzk'));
        await page.selectOption('#atlasSelect', 'elysian-stellar-atlas');
        await page.waitForTimeout(1200);
        const frame = page.frames().find((f) => f !== page.mainFrame());
        assert(frame, 'grand child frame');
        assert.equal(await frame.evaluate(() => DATA.systems.length), 66);
        results.push({ id, empireRows: rows, search: true, childSystems: 66, errors });
      }
      assert.deepEqual(errors, [], id + ' browser errors');
      await page.close();
      console.log('PASS', id);
    }
    fs.writeFileSync(
      path.join(root, 'docs/browser-results.json'),
      JSON.stringify(results, null, 2) + '\n'
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
