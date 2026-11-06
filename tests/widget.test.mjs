import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Widget mode (?view=widget) embeds one region, system or planet. The golden tours do not drive it,
// so its rules are tested here against the built pages in dist/.
const require = createRequire(import.meta.url);
const { open } = require('./dom.cjs');
const ATLASES = ['calidor', 'elysian', 'iulr', 'kadaym', 'uacs'];

async function withPage(id, query, body) {
  const html = await readFile(new URL(`../dist/${id}-atlas.html`, import.meta.url), 'utf8');
  const { w, errors } = open(html, `${id}?${query}`);
  try {
    await new Promise((r) => setTimeout(r, 40));
    await body(w, errors);
  } finally {
    w.close();
  }
}
const data = async (id) =>
  JSON.parse(await readFile(new URL(`../bundles/${id}/atlas.json`, import.meta.url), 'utf8')).data;

for (const id of ATLASES) {
  test(`${id}: widget mode with no region, system or planet shows a message, not an atlas`, async () => {
    await withPage(id, 'view=widget', (w, errors) => {
      assert.deepEqual(errors, []);
      assert.match(
        w.document.querySelector('#systemFocus').textContent,
        /Choose a catalogued region, system, or planet for this widget./
      );
    });
  });

  test(`${id}: widget mode never picks a default planet for a system`, async () => {
    const d = await data(id);
    const system = d.systems.find((s) => (s.worlds || []).length > 1);
    await withPage(id, `view=widget&system=${encodeURIComponent(system.id)}`, (w) => {
      assert.equal(w.eval('selectedWorld'), null);
    });
  });

  test(`${id}: region outlines carry a pressed state in widget mode`, async () => {
    const d = await data(id);
    const region = Object.keys(d.regions)[0];
    await withPage(id, `view=widget&region=${encodeURIComponent(region)}`, (w) => {
      const outlines = [...w.document.querySelectorAll('[data-region-outline]')];
      assert.ok(outlines.length > 0, 'no region outlines found');
      for (const o of outlines)
        assert.ok(o.hasAttribute('aria-pressed'), 'outline without aria-pressed');
    });
  });
}
