import { defineConfig } from '@playwright/test';

// Browser tests for the built atlases in dist/. Run them with `npm run e2e`; `npm run e2e:update` rewrites the baselines.
const PORT = process.env.E2E_PORT || '4173';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 20 * 60 * 1000,
  workers: 3,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC'
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}-{platform}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' }
  },
  webServer: {
    command: 'node tools/serve.mjs',
    url: `http://127.0.0.1:${PORT}/index.html`,
    env: { PORT },
    reuseExistingServer: true,
    timeout: 30000
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
