import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Two tools for the widget workflow: zoom inside a system widget, and copying a widget query for the
// current view (no leading "?") to paste into an AtlasEmbed tag.
const require = createRequire(import.meta.url);
const { open } = require('./dom.cjs');
const ATLASES = ['calidor', 'elysian', 'iulr', 'kadaym', 'uacs', 'minimal'];

const data = async (id) =>
  JSON.parse(
    await readFile(
      new URL(
        id === 'minimal' ? '../examples/minimal-atlas/atlas.json' : `../bundles/${id}/atlas.json`,
        import.meta.url
      ),
      'utf8'
    )
  ).data;

async function withPage(id, query, body) {
  const html = await readFile(new URL(`../dist/${id}-atlas.html`, import.meta.url), 'utf8');
  const { w, errors } = open(html, `${id}?${query}`);
  try {
    await new Promise((r) => setTimeout(r, 40));
    await body(w, errors);
  } finally {
    await new Promise((r) => setTimeout(r, 700));
    w.close();
  }
}
const viewBoxWidth = (w) =>
  Number(w.document.querySelector('#orbitDiagram').getAttribute('viewBox').split(' ')[2]);
const orbitSystem = async (id) => {
  const d = await data(id);
  return d.systems.find((s) => (s.worlds || []).length && !s.unplottedSystem);
};

for (const id of ATLASES) {
  test(`${id}: a system widget zooms with its buttons, the wheel and the keys`, async () => {
    const system = await orbitSystem(id);
    await withPage(id, `view=widget&system=${encodeURIComponent(system.id)}`, (w, errors) => {
      assert.deepEqual(errors, []);
      const chart = w.document.querySelector('#orbitDiagram');
      assert.ok(chart, 'no orbit diagram');
      assert.equal(viewBoxWidth(w), 760);
      w.document.getElementById('widgetZoomIn').click();
      assert.ok(viewBoxWidth(w) < 760, 'zoom in');
      const zoomedIn = viewBoxWidth(w);
      w.document.getElementById('widgetZoomOut').click();
      assert.ok(viewBoxWidth(w) > zoomedIn, 'zoom out');
      chart.dispatchEvent(
        new w.WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true })
      );
      assert.ok(viewBoxWidth(w) < 760, 'wheel zooms in');
      chart.dispatchEvent(new w.KeyboardEvent('keydown', { key: '0', bubbles: true }));
      assert.equal(viewBoxWidth(w), 760, 'key 0 resets');
      chart.dispatchEvent(new w.KeyboardEvent('keydown', { key: '+', bubbles: true }));
      assert.ok(viewBoxWidth(w) < 760, 'key + zooms in');
      w.document.getElementById('widgetZoomReset').click();
      assert.equal(viewBoxWidth(w), 760, 'reset button');
    });
  });

  test(`${id}: Widget query copies the current view without a leading ?`, async () => {
    const system = await orbitSystem(id);
    const planet = system.worlds[0];
    await withPage(id, '', async (w, errors) => {
      w.AtlasFramework.navigate({ system: system.id, planet });
      const query = w.eval('widgetQuery()');
      const params = new URLSearchParams(query);
      assert.ok(!query.startsWith('?'), 'no leading ?');
      assert.equal(params.get('view'), 'widget');
      assert.equal(params.get('system'), system.slug || system.id);
      assert.equal(params.has('embed'), false);
      // the clipboard
      const copied = [];
      Object.defineProperty(w.navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (text) => copied.push(text) }
      });
      w.document.getElementById('copyWidget').click();
      await new Promise((r) => setTimeout(r, 20));
      assert.deepEqual(copied, [query]);
      assert.match(w.document.getElementById('toast').textContent, /Copied widget query/);
      assert.deepEqual(errors, []);
    });
  });
}

test('a region and the whole atlas copy as a region widget and a bare widget', async () => {
  const d = await data('calidor');
  const region = Object.keys(d.regions)[0];
  await withPage('calidor', '', (w) => {
    w.AtlasFramework.navigate({ region });
    assert.equal(w.eval('widgetQuery()'), `view=widget&region=${encodeURIComponent(region)}`);
    w.AtlasFramework.navigate({});
    assert.equal(w.eval('widgetQuery()'), 'view=widget');
  });
});

test('with no clipboard access the query is shown instead of being lost', async () => {
  await withPage('minimal', 'system=demo-star', async (w) => {
    Object.defineProperty(w.navigator, 'clipboard', { configurable: true, value: undefined });
    w.document.getElementById('copyWidget').click();
    await new Promise((r) => setTimeout(r, 20));
    assert.match(w.document.getElementById('toast').textContent, /view=widget&system=demo-star/);
  });
});
