#!/usr/bin/env node
// Compare one tour step between two builds of an atlas, as text.
//   node tools/page-diff.mjs <oldDistDir> <atlas> <step key> [maxLines]
// Needs a build in ./dist (new) and in <oldDistDir>.
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { stepsFor } from '../tests/tour-steps.mjs';
import { atlasData, runStep } from '../tests/e2e/page.mjs';

const [oldDir, id, key, max = '40'] = process.argv.slice(2);
const steps = stepsFor(await atlasData(id));
const step = steps.find((s) => s.key === key);
if (!step) {
  console.error(
    'no such step; try one of',
    steps.slice(0, 5).map((s) => s.key)
  );
  process.exit(1);
}
const browser = await chromium.launch();
async function dump(dir) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/*', (r) =>
    r.request().url().startsWith('file:') ? r.continue() : r.abort()
  );
  await page.addInitScript(() => {
    let seed = 12345;
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    Math.random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  });
  await page.clock.install({ time: new Date('2023-11-14T22:13:20Z') });
  await page.goto(pathToFileURL(path.resolve(dir, `${id}-atlas.html`)).href);
  await page.waitForFunction(() => typeof window.AtlasFramework?.navigate === 'function');
  await page.clock.runFor(150);
  await runStep(page, step);
  const html = await page.evaluate(() => {
    const b = document.body.cloneNode(true);
    b.querySelectorAll('script,style').forEach((n) => n.remove());
    // Orbit positions, file addresses and the live-infobox status text differ between runs.
    return b.innerHTML
      .replace(/ transform="translate\([^"]*\)"/g, '')
      .replace(/file:\/\/[^"?]*\//g, '')
      .replace(/Checking Codex…|No Codex infobox · atlas record/g, 'STATUS')
      .replace(/></g, '>\n<');
  });
  await page.close();
  return html;
}
const a = await dump(oldDir),
  b = await dump('dist');
await browser.close();
writeFileSync('/tmp/old.html', a);
writeFileSync('/tmp/new.html', b);
const d = spawnSync(
  'git',
  ['diff', '--no-index', '--word-diff=plain', '-U0', '/tmp/old.html', '/tmp/new.html'],
  { encoding: 'utf8' }
);
console.log(
  d.stdout
    .split('\n')
    .filter((l) => /\[-|\{\+/.test(l))
    .slice(0, Number(max))
    .map((l) => l.slice(0, 400))
    .join('\n') || 'identical'
);
