// Golden-master tour. Drives every region, system, planet, satellite and station of each stellar
// atlas through AtlasFramework.navigate in jsdom and records a hash of the rendered DOM per step.
// Geometry is mocked (see dom.cjs), so this checks structure and text, not visual layout.
//
//   node tests/golden.cjs            compare against tests/golden/*.json
//   node tests/golden.cjs --update   rewrite the golden files
//   node tests/golden.cjs --quick    every 10th step only (fast smoke check)
//   node tests/golden.cjs calidor    one atlas
//   --html FILE --out FILE           tour another build of one atlas and write the raw result
//                                    (used by tools/dedup-lab.mjs)
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { open } = require('./dom.cjs');
const root = path.resolve(__dirname, '..');
const ATLASES = ['calidor', 'elysian', 'iulr', 'kadaym', 'uacs'];

/** Make the page deterministic: fixed clock and a seeded Math.random. */
function freeze(w) {
  let seed = 12345;
  w.Math.random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const FIXED = 1700000000000;
  const RealDate = w.Date;
  class FixedDate extends RealDate {
    constructor(...a) {
      super(...(a.length ? a : [FIXED]));
    }
    static now() {
      return FIXED;
    }
  }
  w.Date = FixedDate;
  w.performance.now = () => 0;
  // Track timers so the tour can cancel them before closing the window.
  const timers = new Set();
  for (const [set, clear] of [
    ['setTimeout', 'clearTimeout'],
    ['setInterval', 'clearInterval']
  ]) {
    const real = w[set].bind(w);
    w[set] = (fn, ms, ...args) => {
      const id = real(fn, ms, ...args);
      timers.add([clear, id]);
      return id;
    };
  }
  w.__cancelTimers = () => {
    for (const [clear, id] of timers) w[clear](id);
    timers.clear();
  };
}

/** The tour steps (shared with the browser tours), with each act turned into a jsdom function. */
const actFn = (a) =>
  !a
    ? undefined
    : {
        open: () => openStation(a.name),
        close: () => closeStation,
        search: () => typeSearch(a.term),
        click: () => click(a.sel, a.n),
        clickId: () => (w) => w.document.getElementById(a.id)?.click(),
        flip: () => flip(a.n),
        key: () => keyOnMap(a.key)
      }[a.t]();
async function stepsFor(data) {
  const { stepsFor: base } = await import('./tour-steps.mjs');
  return base(data).map((step) => ({ ...step, act: actFn(step.act) }));
}

const click =
  (sel, n = 0) =>
  (w) =>
    w.document.querySelectorAll(sel)[n]?.click();
const flip = (n) => (w) => {
  const el = w.document.querySelectorAll('[data-filter]')[n];
  if (!el) return;
  el.checked = !el.checked;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};
const typeSearch = (term) => (w) => {
  const el = w.document.getElementById('search');
  if (!el) return;
  el.value = term;
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
  // The page debounces search input with a short timer.
  return new Promise((resolve) => setTimeout(resolve, 130));
};
const keyOnMap = (key) => (w) =>
  w.document
    .getElementById('map')
    ?.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true }));
const openStation = (name) => (w) => {
  if (w.eval('typeof openStation') === 'function')
    w.eval('openStation(' + JSON.stringify(name) + ')');
};
const closeStation = (w) => {
  if (w.eval('typeof closeStation') === 'function') w.eval('closeStation()');
};

function snapshot(w) {
  const clone = w.document.body.cloneNode(true);
  clone.querySelectorAll('script,style').forEach((n) => n.remove());
  const text = w.location.search + '|' + w.document.title + '|' + clone.innerHTML;
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
}

/**
 * Quick mode skips most steps, so find the stations whose screen really opens (they render an
 * element whose class ends in "-plate") and keep those: they exercise the station functions.
 * Returns the step keys to keep. Capped so a quick tour stays quick.
 */
function probeOpens(w, data, limit = 8) {
  const keys = new Set();
  let found = 0;
  for (const st of data.stations || []) {
    if (found >= limit) break;
    try {
      w.AtlasFramework.navigate({ system: st.system });
      openStation(st.name)(w);
      if (w.document.querySelector('[class*="-plate"]')) {
        keys.add(`open-station:${st.system}:${st.name}`);
        keys.add(`close-station:${st.system}:${st.name}`);
        found++;
      }
      closeStation(w);
    } catch {
      // A station that cannot open is simply not kept.
    }
  }
  return keys;
}

/** Run the tour for one atlas page. Returns { key: hash | 'ERR: message' }. */
async function tour(html, id, data, { quick = false } = {}) {
  const { w, errors } = open(html, id, freeze);
  await new Promise((r) => setTimeout(r, 15));
  const out = {};
  // Errors thrown while the page loaded. Absent (and so absent from golden files) when clean.
  if (errors.length) out.__load = 'ERR: ' + errors[0].split('\n')[0];
  let steps = await stepsFor(data);
  if (quick) {
    const keep = probeOpens(w, data);
    steps = steps.filter((st, i) => st.always || i % 10 === 0 || keep.has(st.key));
  }
  for (const step of steps) {
    errors.length = 0;
    try {
      if (step.route) w.AtlasFramework.navigate(step.route);
      if (step.act) await step.act(w);
      out[step.key] = errors.length ? 'ERR: ' + errors[0].split('\n')[0] : snapshot(w);
    } catch (e) {
      out[step.key] = 'ERR: ' + String(e.message).split('\n')[0];
    }
  }
  // The window is deliberately not closed: late page callbacks would throw on a closed window.
  // Run each tour in its own short-lived process.
  w.__cancelTimers();
  return out;
}

function diff(expected, actual) {
  const changed = [],
    added = [],
    missing = [];
  for (const k of Object.keys(expected)) {
    if (!(k in actual)) missing.push(k);
    else if (expected[k] !== actual[k]) changed.push(k);
  }
  for (const k of Object.keys(actual)) if (!(k in expected)) added.push(k);
  return { changed, added, missing };
}

module.exports = { tour, diff, stepsFor, ATLASES };

if (require.main === module)
  (async () => {
    const args = process.argv.slice(2);
    const update = args.includes('--update'),
      quick = args.includes('--quick');
    const opt = (n) => (args.includes('--' + n) ? args[args.indexOf('--' + n) + 1] : null);
    const htmlOverride = opt('html'),
      outFile = opt('out');
    const ids = args.filter(
      (a, i) => !a.startsWith('--') && !['--html', '--out'].includes(args[i - 1])
    );
    const targets = ids.length ? ids : ATLASES;
    const goldenDir = path.join(root, 'tests', 'golden');
    // Quick mode skips steps, and some atlases (IULR) render a step differently depending on earlier
    // steps, so quick runs have their own golden files.
    const goldenFor = (id) => path.join(goldenDir, quick ? 'quick' : '', id + '.json');
    fs.mkdirSync(path.dirname(goldenFor('x')), { recursive: true });
    let failed = 0;
    for (const id of targets) {
      const html = fs.readFileSync(
        htmlOverride || path.join(root, 'dist', id + '-atlas.html'),
        'utf8'
      );
      const data = JSON.parse(
        fs.readFileSync(path.join(root, 'bundles', id, 'atlas.json'), 'utf8')
      ).data;
      const started = Date.now();
      const actual = await tour(html, id, data, { quick });
      if (outFile) {
        fs.writeFileSync(outFile, JSON.stringify(actual));
        continue;
      }
      const file = goldenFor(id);
      const errors = Object.entries(actual).filter(([, v]) => v.startsWith('ERR')).length;
      if (update) {
        fs.writeFileSync(file, JSON.stringify(actual, null, 0) + '\n');
        console.log(`WROTE ${id}: ${Object.keys(actual).length} steps, ${errors} errors`);
        continue;
      }
      const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
      const d = diff(expected, actual);
      const bad = d.changed.length + d.added.length + d.missing.length;
      const secs = ((Date.now() - started) / 1000).toFixed(1);
      if (bad) {
        failed++;
        console.log(
          `FAIL ${id}: ${d.changed.length} changed, ${d.added.length} added, ${d.missing.length} missing (${secs}s)`
        );
        console.log('  e.g.', [...d.changed, ...d.added, ...d.missing].slice(0, 5).join(', '));
      } else console.log(`PASS ${id}: ${Object.keys(actual).length} steps (${secs}s)`);
    }
    process.exit(failed ? 1 : 0);
  })();
