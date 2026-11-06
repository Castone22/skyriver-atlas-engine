// The atlas tour in a real browser. Every region, system, planet, satellite and station, the station
// screens and the page's own controls are visited in order. A hash of the page after each step is
// compared with a baseline, one line per step, so a failure names the steps that changed.
// Rewrite the baselines with `playwright test --update-snapshots`.
import { test, expect } from '@playwright/test';
import { stepsFor } from '../tour-steps.mjs';
import { ATLASES, atlasData, openAtlas, runStep, snapshot } from './page.mjs';

for (const id of ATLASES) {
  test(`tour: ${id}`, async ({ page }) => {
    const errors = await openAtlas(page, id);
    expect(errors, 'page errors while loading').toEqual([]);
    const lines = [];
    for (const step of stepsFor(await atlasData(id))) {
      const before = errors.length;
      let result;
      try {
        await runStep(page, step);
        result = errors.length > before ? 'ERR: ' + errors[before] : await snapshot(page);
      } catch (e) {
        result = 'ERR: ' + String(e.message).split('\n')[0];
      }
      lines.push(`${step.key}\t${result}`);
    }
    expect(
      lines.filter((l) => l.split('\t')[1].startsWith('ERR')).slice(0, 5),
      'steps that raised errors'
    ).toEqual([]);
    expect(lines.join('\n') + '\n').toMatchSnapshot(`${id}-tour.txt`);
  });
}
