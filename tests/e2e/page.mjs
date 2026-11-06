// Helpers for driving a built atlas in a real browser deterministically.
import { readFile } from 'node:fs/promises';

export const ATLASES = ['calidor', 'elysian', 'iulr', 'kadaym', 'uacs'];

export const atlasData = async (id) =>
  JSON.parse(await readFile(new URL(`../../bundles/${id}/atlas.json`, import.meta.url), 'utf8'))
    .data;

const FIXED_TIME = new Date('2023-11-14T22:13:20Z');

/**
 * Open an atlas with a fixed clock, a seeded Math.random and no network, and wait until it has
 * started. Timers only advance when the test advances them (`settle`), so every run sees the same
 * page. Returns the page errors collected so far.
 */
export async function openAtlas(page, id, query = '') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).split('\n')[0]));
  await page.route('**/*', (route) =>
    route.request().url().startsWith('http://127.0.0.1') ? route.continue() : route.abort()
  );
  await page.clock.install({ time: FIXED_TIME });
  await page.addInitScript(() => {
    let seed = 12345;
    // The orbit diagram animates with requestAnimationFrame; frozen, every run draws the same frame.
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    Math.random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  });
  await page.goto(`/${id}-atlas.html${query}`);
  await page.waitForFunction(() => typeof window.AtlasFramework?.navigate === 'function');
  await settle(page);
  return errors;
}

/** Advance the page's fake clock so debounced and scheduled work finishes. */
export const settle = (page, ms = 150) => page.clock.runFor(ms);

/** A short hash of the rendered page: its URL query, title and body markup without scripts and styles. */
export const snapshot = (page) =>
  page.evaluate(() => {
    const body = document.body.cloneNode(true);
    body.querySelectorAll('script,style').forEach((n) => n.remove());
    const text = location.search + '|' + document.title + '|' + body.innerHTML;
    // cyrb53
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  });

/** Run one step of the tour (see tests/tour-steps.mjs). */
export async function runStep(page, step) {
  if (step.route) await page.evaluate((r) => window.AtlasFramework.navigate(r), step.route);
  const a = step.act;
  if (a) {
    await page.evaluate((a) => {
      const q = (sel, n = 0) => document.querySelectorAll(sel)[n];
      if (a.t === 'open') {
        if (typeof openStation === 'function') openStation(a.name);
      } else if (a.t === 'close') {
        if (typeof closeStation === 'function') closeStation();
      } else if (a.t === 'search') {
        const el = document.getElementById('search');
        if (el) {
          el.value = a.term;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else if (a.t === 'click') q(a.sel, a.n)?.click();
      else if (a.t === 'clickId') document.getElementById(a.id)?.click();
      else if (a.t === 'flip') {
        const el = q('[data-filter]', a.n);
        if (el) {
          el.checked = !el.checked;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if (a.t === 'key')
        document
          .getElementById('map')
          ?.dispatchEvent(new KeyboardEvent('keydown', { key: a.key, bubbles: true }));
    }, a);
  }
  await settle(page, 100);
}
