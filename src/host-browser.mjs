/**
 * A compileCore host for browsers (and any runtime with fetch and CompressionStream).
 * Pure: no Node imports. See docs/TRANSPORTS.md.
 */
import { loadHttp, FetchError } from './bundle-http.mjs';

const BUNDLE_ID = /^[a-z0-9][a-z0-9_-]*$/;

/** gzip text and return it base64-encoded. */
export async function gzipBase64(text) {
  if (typeof CompressionStream === 'undefined')
    throw new Error('This browser cannot compress child atlases (CompressionStream is missing)');
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/**
 * @param {object} options
 * @param {string} options.engineUrl directory URL of the engine bundle
 * @param {(id: string) => string} options.atlasUrl directory URL of an atlas bundle
 * @param {(sha256: string) => string} options.assetUrl URL of an asset
 * @param {typeof fetch} [options.fetch]
 * @param {boolean} [options.verify] check file digests while loading
 * @param {string} [options.versionParam] add `?<name>=<sha256 prefix>` to file URLs (see loadHttp)
 */
export function createBrowserHost({
  engineUrl,
  atlasUrl,
  assetUrl,
  fetch = globalThis.fetch,
  verify = false,
  versionParam
}) {
  const cache = new Map();
  const cached = (key, load) => {
    if (!cache.has(key)) {
      const pending = load();
      cache.set(key, pending);
      pending.catch(() => cache.delete(key));
    }
    return cache.get(key);
  };
  return {
    engine: () =>
      cached('engine', () =>
        loadHttp(engineUrl, { fetch, expectType: 'engine', verify, versionParam })
      ),
    atlas: (id) =>
      BUNDLE_ID.test(id)
        ? cached('atlas:' + id, () =>
            loadHttp(atlasUrl(id), { fetch, expectType: 'atlas', verify, versionParam }).catch(
              (e) => {
                // A bundle that is not there is "no such renderer", not a crash.
                if (e instanceof FetchError && e.status === 404) return null;
                throw e;
              }
            )
          )
        : Promise.resolve(null),
    // Images are served by URL, not inlined.
    asset: async (sha256) => assetUrl(sha256),
    gzipBase64
  };
}
