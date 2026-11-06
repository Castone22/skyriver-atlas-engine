import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// The schematic view of a station: a root `schematics` array in atlas.json, and a station that names
// an entry by key. The drawing is markup in the data or the name of a function the atlas defines.
const require = createRequire(import.meta.url);
const { open } = require('./dom.cjs');

async function withPage(body) {
  const html = await readFile(new URL('../dist/minimal-atlas.html', import.meta.url), 'utf8');
  const { w, errors } = open(html, 'minimal?system=demo-star');
  try {
    await new Promise((r) => setTimeout(r, 40));
    await body(w, errors);
  } finally {
    // Let the page's own timers finish before its window goes away.
    await new Promise((r) => setTimeout(r, 700));
    w.close();
  }
}

test('a station with a schematic opens its screen from the data', async () => {
  await withPage((w, errors) => {
    assert.equal(
      w.eval("hasStationSchematic(stationRecords(resolveSystem('demo-star'))[0])"),
      true
    );
    w.eval("openStation('Demo Orbital')");
    const screen = w.document.querySelector('.station-screen');
    assert.ok(screen, 'station screen not shown');
    assert.match(screen.textContent, /A demonstration structure/);
    assert.match(screen.textContent, /Length/);
    assert.ok(screen.querySelector('svg.tora-plate'), 'drawing not shown');
    assert.equal(screen.querySelectorAll('[data-part]').length >= 2, true);
    assert.deepEqual(errors, []);
  });
});

test('selecting a part shows its note', async () => {
  await withPage((w) => {
    w.eval("openStation('Demo Orbital')");
    w.eval('highlightPart(1)');
    assert.match(w.document.querySelector('#partReadout').textContent, /round habitation hub/);
  });
});

test('a drawing can be a function the atlas defines', async () => {
  await withPage((w, errors) => {
    w.eval(
      "window.demoDrawing=(st,s)=>'<svg id=\"from-function\" class=\"tora-plate\"><title>'+st.name+' in '+s.name+'</title></svg>';DATA.schematics[0].drawing={function:'demoDrawing'}"
    );
    w.eval("openStation('Demo Orbital')");
    const drawing = w.document.querySelector('#from-function');
    assert.ok(drawing, 'function drawing not used');
    assert.match(drawing.textContent, /Demo Orbital in Demo Star/);
    assert.deepEqual(errors, []);
  });
});

test('a station without a schematic has no screen', async () => {
  await withPage((w) => {
    assert.equal(w.eval("hasStationSchematic({name:'X',category:'Other'})"), false);
    assert.equal(w.eval("stationScreen(resolveSystem('demo-star'),{name:'X'})"), '');
  });
});
