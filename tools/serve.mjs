import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url)),
  port = Number(process.env.PORT || 8080);
http
  .createServer(async (req, res) => {
    try {
      const target = path.resolve(
        root,
        '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      );
      if (!target.startsWith(root)) throw Error();
      const p = target === path.resolve(root) ? path.join(root, 'index.html') : target;
      const b = await readFile(p);
      res.setHeader(
        'Content-Type',
        p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/json'
      );
      res.end(b);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`Atlas previews: http://127.0.0.1:${port}`));
