/**
 * HTTP directory transport. See docs/TRANSPORTS.md.
 *
 * A bundle served over HTTP cannot be listed, so its bundle.json must carry a `files` map
 * (path -> sha256). Files are fetched lazily, once each, relative to the bundle's base URL.
 *
 * This module has no Node imports; `fetch` is injectable so it can be tested and reused.
 */
import { Bundle, openBundle, sha256Text, isSafePath } from './bundle.mjs';

/** An error that remembers the URL and HTTP status (0 for network failures). */
export class FetchError extends Error {
  constructor(url, status, detail) {
    super(`Failed to fetch ${url} (${status ? 'HTTP ' + status : detail})`);
    this.name = 'FetchError';
    this.url = url;
    this.status = status;
  }
}

const resolveBase = (baseUrl) => {
  const absolute = new URL(baseUrl, globalThis.location?.href);
  if (!absolute.pathname.endsWith('/')) absolute.pathname += '/';
  return absolute;
};

/**
 * Open a bundle served at `baseUrl`.
 * @param {string} baseUrl directory URL holding bundle.json
 * @param {object} [options]
 * @param {typeof fetch} [options.fetch] defaults to the global fetch
 * @param {'atlas'|'engine'} [options.expectType]
 * @param {boolean} [options.verify] hash every file as it is fetched and compare with `files`
 * @param {string} [options.versionParam] if set, file URLs (not bundle.json) get
 *   `?<versionParam>=<first 16 hex of the file's sha256>` so a server can cache them as immutable
 */
export async function loadHttp(
  baseUrl,
  { fetch = globalThis.fetch, expectType, verify = false, versionParam } = {}
) {
  const base = resolveBase(baseUrl);
  const get = async (rel, sha256) => {
    const target = new URL(rel.split('/').map(encodeURIComponent).join('/'), base);
    if (versionParam && sha256) target.searchParams.set(versionParam, sha256.slice(0, 16));
    const url = target.href;
    let response;
    try {
      // Public static files: never send credentials.
      response = await fetch(url, { credentials: 'omit' });
    } catch (e) {
      throw new FetchError(url, 0, e.message);
    }
    if (!response.ok) throw new FetchError(url, response.status);
    return response.text();
  };

  const manifestText = await get('bundle.json');
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch (e) {
    throw new Error(`${new URL('bundle.json', base).href} is not valid JSON: ${e.message}`);
  }
  if (!manifest?.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files))
    throw new Error(
      `${new URL('bundle.json', base).href} has no \`files\` map; a bundle served over HTTP must list its files`
    );
  for (const p of Object.keys(manifest.files))
    if (!isSafePath(p)) throw new Error(`Unsafe path in files: '${p}'`);

  // A pack holds many small files in one JSON file (path -> text). It is fetched once, on the first read of a
  // file under its prefix; if it cannot be fetched, files are fetched one by one as before.
  const pack = manifest.pack;
  let packed;
  const packContents = () => {
    packed ??= get(pack.file, manifest.files[pack.file]).then(
      (text) => {
        const contents = JSON.parse(text);
        return contents && typeof contents === 'object' ? contents : null;
      },
      () => null
    );
    return packed;
  };
  const fromPack = async (p) => {
    if (!pack || !p.startsWith(pack.prefix) || p === pack.file) return null;
    const text = (await packContents())?.[p];
    return typeof text === 'string' ? text : null;
  };

  const cache = new Map();
  const read = (p) => {
    if (p === 'bundle.json') return Promise.resolve(manifestText);
    if (!cache.has(p)) {
      const pending = (async () => (await fromPack(p)) ?? (await get(p, manifest.files[p])))().then(
        async (text) => {
          if (verify) {
            const actual = await sha256Text(text);
            if (actual !== manifest.files[p])
              throw new Error(
                `sha256 mismatch for ${new URL(p, base).href} (expected ${manifest.files[p]}, got ${actual})`
              );
          }
          return text;
        }
      );
      cache.set(p, pending);
      // Do not cache failures: a later attempt may succeed.
      pending.catch(() => cache.delete(p));
    }
    return cache.get(p);
  };
  return openBundle(new Bundle({ files: ['bundle.json', ...Object.keys(manifest.files)], read }), {
    expectType
  });
}
