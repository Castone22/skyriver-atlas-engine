// Screenshots of key views of each atlas: the whole atlas, a region, a system and a planet. They
// cover layout and styling, which the tours do not see. Rewrite the baselines with
// `playwright test --update-snapshots`.
import { test, expect } from '@playwright/test';
import { ATLASES, atlasData, openAtlas, settle } from './page.mjs';

for (const id of ATLASES) {
  test(`screens: ${id}`, async ({ page }) => {
    const data = await atlasData(id);
    const system = data.systems.find((s) => (s.worlds || []).some((w) => data.worlds[w]));
    const world = system.worlds.find((w) => data.worlds[w]);
    const views = [
      ['overview', {}],
      ['region', { region: Object.keys(data.regions)[0] }],
      ['system', { system: system.id }],
      ['planet', { system: system.id, planet: world }]
    ];
    const errors = await openAtlas(page, id);
    for (const [name, route] of views) {
      await page.evaluate((r) => window.AtlasFramework.navigate(r), route);
      await settle(page, 300);
      await expect(page).toHaveScreenshot(`${id}-${name}.png`);
    }
    expect(errors).toEqual([]);
  });
}
