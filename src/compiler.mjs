/**
 * Node host for the pure compiler core (src/compile-core.mjs). It supplies the environment the
 * core needs from disk and Node: bundle directories, asset files, gzip and the search indexer.
 * The public API, `compile` and `writeAtlas`, is unchanged.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { loadDirectory } from './bundle-fs.mjs';
import { compileCore } from './compile-core.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BUNDLE_ID = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * A host that reads `engine/`, `bundles/` and `assets/` under `root`. Bundles are cached. `bundles`
 * maps an id to an atlas bundle that is already open (for example a datapack outside `bundles/`).
 */
export function createNodeHost({ root = ROOT, bundles = {}, wikiBase } = {}) {
  const cache = new Map();
  const cached = (key, load) => {
    if (!cache.has(key)) cache.set(key, load());
    return cache.get(key);
  };
  const assetManifest = () =>
    cached('assets', async () =>
      JSON.parse(await readFile(path.join(root, 'assets', 'manifest.json'), 'utf8'))
    );
  return {
    wikiBase,
    engine: () =>
      cached('engine', () => loadDirectory(path.join(root, 'engine'), { expectType: 'engine' })),
    atlas: (id) =>
      bundles[id]
        ? Promise.resolve(bundles[id])
        : BUNDLE_ID.test(id)
          ? cached('atlas:' + id, () =>
              loadDirectory(path.join(root, 'bundles', id), { expectType: 'atlas' }).catch((e) => {
                if (e.code === 'ENOENT') return null;
                throw e;
              })
            )
          : Promise.resolve(null),
    async asset(id) {
      const info = (await assetManifest())[id];
      if (!info) throw new Error(`Missing asset: ${id}`);
      const bytes = await readFile(path.join(root, info.file));
      return `data:${info.mime};base64,${bytes.toString('base64')}`;
    },
    // mtime 0 keeps the output deterministic.
    gzipBase64: async (text) => gzipSync(text, { mtime: 0 }).toString('base64'),
    // Evaluates the repo's own Grand runtime to precompute its search seed.
    async loadSearch(code) {
      const context = vm.createContext({});
      vm.runInContext(code, context, { timeout: 1000 });
      return context.GrandAtlasSearch;
    }
  };
}

const defaultHost = createNodeHost();

/** Link shared source functions and profile adapters; emit a portable, self-contained artifact. */
export function compile(definition, { host = defaultHost, ...options } = {}) {
  return compileCore(definition, host, options);
}

export async function writeAtlas(definition, filename, options) {
  const result = await compile(definition, options);
  await mkdir(path.dirname(path.resolve(filename)), { recursive: true });
  await writeFile(filename, result.html);
  return result;
}
