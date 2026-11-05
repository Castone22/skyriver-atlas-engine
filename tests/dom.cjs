// DOM integration tests. Canvas/SVG geometry are mocked; this does not replace visual browser QA.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  vm = require('node:vm'),
  zlib = require('node:zlib');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..'),
  results = [];
function open(html, id, setup = () => {}) {
  const errors = [],
    vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    if (e.type === 'unhandled exception') errors.push(e.detail?.stack || e.message);
  });
  const dom = new JSDOM(html, {
    url: 'https://atlas.example/' + id,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
      w.fetch = () => Promise.reject(Error('offline test'));
      w.ResizeObserver = class {
        observe() {}
        disconnect() {}
      };
      w.requestAnimationFrame = () => 1;
      w.cancelAnimationFrame = () => {};
      w.TextDecoder = TextDecoder;
      w.TextEncoder = TextEncoder;
      w.DecompressionStream = DecompressionStream;
      w.URL.createObjectURL = () => 'blob:https://atlas.example/test';
      w.URL.revokeObjectURL = () => {};
      w.HTMLElement.prototype.getBoundingClientRect = w.SVGElement.prototype.getBoundingClientRect =
        function () {
          return {
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            width: 1000,
            height: 700,
            right: 1000,
            bottom: 700
          };
        };
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', {
        get() {
          return 1000;
        }
      });
      Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', {
        get() {
          return 700;
        }
      });
      w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 20 });
      w.SVGElement.prototype.getComputedTextLength = () => 90;
      w.SVGElement.prototype.getScreenCTM = () => ({
        inverse() {
          return this;
        }
      });
      w.SVGElement.prototype.createSVGPoint = () => ({
        x: 0,
        y: 0,
        matrixTransform() {
          return this;
        }
      });
      w.HTMLCanvasElement.prototype.getContext = function (kind) {
        if (kind === 'webgl') return null;
        return new Proxy(
          {
            canvas: this,
            createImageData: (a, b) => ({ data: new Uint8ClampedArray(a * b * 4) }),
            getImageData: (x, y, a, b) => ({ data: new Uint8ClampedArray(a * b * 4) }),
            measureText: (s) => ({ width: String(s).length * 8 }),
            createLinearGradient: () => ({ addColorStop() {} }),
            createRadialGradient: () => ({ addColorStop() {} }),
            createPattern: () => null
          },
          { get: (t, k) => (k in t ? t[k] : () => {}) }
        );
      };
      w.HTMLCanvasElement.prototype.toDataURL = () => '';
      w.Path2D = class {};
      w.Element.prototype.scrollIntoView = function () {};
      w.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      w.HTMLDialogElement.prototype.close = function () {
        this.open = false;
      };
      setup(w);
    }
  });
  return { dom, w: dom.window, errors };
}
module.exports = { open };
if (require.main === module)
  (async () => {
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
      const html = fs.readFileSync(path.join(root, 'dist/' + id + '-atlas.html'), 'utf8');
      const { dom, w, errors } = open(html, id);
      try {
        await new Promise((r) => setTimeout(r, 15));
        assert.deepEqual(errors, [], id + ' startup');
        if (!['mahanzk', 'grand'].includes(id)) {
          const data = w.eval('DATA'),
            api = w.AtlasFramework;
          assert(api, id + ' API initialized');
          const expected = Object.keys(data.regions).length + 1;
          assert.equal(
            w.document.querySelectorAll('#regionPicker option, #regionSelect option').length,
            expected
          );
          const target = data.systems.find((s) =>
            s.worlds?.some((name) => data.worlds[name] && data.worlds[name].bodyType !== 'Moon')
          );
          api.navigate({ system: target.id });
          assert(w.eval('systemFocused'), id + ' system focus');
          const planet = target.worlds.find(
            (n) => data.worlds[n] && data.worlds[n].bodyType !== 'Moon'
          );
          api.navigate({ system: target.id, planet });
          assert(w.eval('planetFocus'), id + ' planet focus');
          api.navigate({ region: 'all' });
          assert(!w.eval('systemFocused'), id + ' return to overview');
          const exported = api.exportJSON();
          assert.equal(exported.data.systems.length, data.systems.length);
          assert.equal(exported.id, id);
          const specialized = [];
          if (['elysian', 'calidor', 'iulr'].includes(id)) {
            const station = data.stations.find((s) =>
              id === 'elysian'
                ? s.schematic === 'triad'
                : id === 'calidor'
                  ? s.name === 'Foundry'
                  : s.category === 'TORA'
            );
            api.navigate({ system: station.system });
            w.eval('openStation(' + JSON.stringify(station.name) + ')');
            assert(
              w.document.querySelector(
                id === 'elysian'
                  ? '.triad-plate'
                  : id === 'calidor'
                    ? '.foundry-plate'
                    : '.tora-plate'
              ),
              id + ' schematic'
            );
            specialized.push(station.name);
            api.navigate({ region: 'all' });
          }
          if (id === 'uacs') {
            api.navigate({ system: 'sol' });
            assert(
              w.document.querySelector('[data-solar-analogue="Saturn"]'),
              'Sol ringed-planet glyph'
            );
            specialized.push('Solar System glyphs');
            api.navigate({ region: 'all' });
          }
          if (id === 'elysian') {
            const key = Object.keys(data.worlds)[0];
            w.eval(
              'rememberPlanetArticle(' +
                JSON.stringify(key) +
                ', {title:"Moved Planet",pageid:1234,ns:0})'
            );
            assert.match(api.articleURL(key), /curid=1234/);
            w.eval(
              'rememberPlanetArticle(' +
                JSON.stringify(key) +
                ', {title:"Moved Again",pageid:1234,ns:0})'
            );
            assert.equal(w.eval('planetName(' + JSON.stringify(key) + ')'), 'Moved Again');
            specialized.push('page-id title moves');
          }
          const markerCount = w.document.querySelectorAll('#nodes > g').length;
          assert(markerCount > 0, id + ' map markers');
          results.push({
            id,
            systems: data.systems.length,
            regions: expected - 1,
            navigation: ['overview', 'system', 'planet', 'overview'],
            markers: markerCount,
            specialized,
            errors
          });
        } else if (id === 'mahanzk') {
          const count = w.eval('places.length');
          w.eval('p=target=1;fitMap();focusPlace(places[0])');
          assert.equal(w.document.getElementById('detail').hidden, false);
          assert.match(w.document.getElementById('detailLink').href, /Kurzk/);
          results.push({ id, places: count, placeSelection: true, errors });
        } else {
          assert.equal(w.document.querySelectorAll('#indexList .index-row').length, 5);
          const input = w.document.getElementById('search');
          input.value = 'Mahanzk';
          input.dispatchEvent(new w.Event('input'));
          await new Promise((r) => setTimeout(r, 250));
          assert(w.document.getElementById('indexList').textContent.includes('Mahanzk'));
          const snapshots = JSON.parse(w.document.getElementById('snapshots').textContent);
          const counts = {};
          for (const [key, value] of Object.entries(snapshots)) {
            const source = zlib.gunzipSync(Buffer.from(value, 'base64')).toString();
            const data = w.GrandAtlasSearch.readData(source);
            counts[key] = data.systems.length;
            assert.match(source, /window.AtlasFramework/);
          }
          const P = w.GrandAtlasPriority,
            baseline = JSON.parse(w.document.getElementById('prioritySeed').textContent),
            policy = P.policy(
              Object.fromEntries(Object.entries(baseline).map(([id, data]) => [id, { data }])),
              baseline
            );
          assert.equal(
            P.resolve(policy, 'elysian-stellar-atlas', { system: 'Kevak' }).id,
            'kadaym-stellar-atlas'
          );
          assert.equal(
            P.resolve(policy, 'kadaym-stellar-atlas', { region: 'frontier' }).id,
            'elysian-stellar-atlas'
          );
          const changed = JSON.parse(JSON.stringify(baseline)),
            kevak = changed['kadaym-stellar-atlas'].systems.find((s) => s.name === 'Kevak');
          kevak.affiliation = 'Elysian Collective';
          const sources = Object.fromEntries(
            Object.entries(changed).map(([id, data]) => [id, { data }])
          );
          const transferred = P.policy(sources, baseline);
          assert.equal(
            P.resolve(transferred, 'kadaym-stellar-atlas', { system: 'Kevak' }).id,
            'elysian-stellar-atlas'
          );
          results.push({
            id,
            empireRows: 5,
            search: true,
            priority: true,
            affiliationTransfer: true,
            snapshotSystems: counts,
            errors
          });
        }
        assert.deepEqual(errors, [], id + ' interaction');
        console.log('PASS DOM', id);
      } finally {
        await new Promise((r) => setTimeout(r, 100));
        w.close();
      }
    }
    fs.writeFileSync(
      path.join(root, 'docs/dom-results.json'),
      JSON.stringify(
        {
          method: 'JSDOM with mocked canvas and geometry; not visual browser verification',
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
