// Load an atlas through the built loader the way the wiki does, and report page errors.
//   node tools/sandbox-check.mjs <served dir> <loader.html> <atlas id> [screenshot.png]
// <served dir> holds engine/ and bundles/<id>/ (unzip the packs from `npm run pack` into it); images come from
// assets/manifest.json. The loader page is served with the extension's sandbox CSP, so the page is an opaque
// origin and every image is cross-origin: this catches canvas and WebGL reads of images that were not
// requested with CORS, which a same-origin test cannot.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
const [servedDir, loaderFile, id, shot] = process.argv.slice(2);
const manifest = JSON.parse(await readFile('assets/manifest.json', 'utf8'));
const mime = (f) =>
  ({
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html'
  })[path.extname(f)] ?? 'application/octet-stream';
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const cors = { 'Access-Control-Allow-Origin': '*' };
  try {
    if (u.pathname === '/loader.html') {
      const port = server.address().port;
      const config = JSON.stringify({
        atlas: id,
        engineUrl: `http://127.0.0.1:${port}/engine/`,
        bundlesUrl: `http://127.0.0.1:${port}/bundles/`,
        assetsUrl: `http://127.0.0.1:${port}/assets/`
      }).replace(/</g, '\\u003c');
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Security-Policy':
          'sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox',
        ...cors
      });
      return res.end(
        (await readFile(loaderFile, 'utf8'))
          .replace('@@TITLE@@', 'Atlas')
          .replace('@@CONFIG@@', () => config)
      );
    }
    let file, type;
    if (u.pathname.startsWith('/assets/')) {
      const info = manifest[u.pathname.slice(8)];
      if (!info) throw Error('no asset');
      file = info.file;
      type = info.mime;
    } else file = path.join(servedDir, u.pathname);
    res.writeHead(200, { 'Content-Type': type ?? mime(file), ...cors });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, cors);
    res.end('nf');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
await page.goto(`http://127.0.0.1:${server.address().port}/loader.html`);
await page.waitForTimeout(8000);
console.log(id, 'errors:', JSON.stringify(errors.slice(0, 3)));
if (shot) await page.screenshot({ path: shot });
await browser.close();
server.close();
