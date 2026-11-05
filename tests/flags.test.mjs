import test from 'node:test';
import assert from 'node:assert/strict';
import { compileCore } from '../src/compile-core.mjs';
import { createNodeHost } from '../src/compiler.mjs';

const disk = createNodeHost();
const registry = {
  highlightRegion: { description: 'test flag', default: false },
  budget: { description: 'test number', default: 3 }
};

/** A host whose engine has the given flag registry and whose calidor bundle has these flags. */
async function hostWith({ registry: reg = registry, flags } = {}) {
  const engine = await disk.engine();
  const patchedEngine = Object.create(engine);
  patchedEngine.has = (p) => p === 'flags.json' || engine.has(p);
  patchedEngine.json = (p) => (p === 'flags.json' ? Promise.resolve(reg) : engine.json(p));
  const calidor = await disk.atlas('calidor');
  const patchedAtlas = Object.create(calidor);
  patchedAtlas.manifest = { ...calidor.manifest, flags };
  return {
    host: {
      ...disk,
      engine: async () => patchedEngine,
      atlas: async (id) => (id === 'calidor' ? patchedAtlas : disk.atlas(id))
    },
    definition: await calidor.json('atlas.json')
  };
}

/** The __ATLAS__ configuration object embedded in the compiled page. */
function atlasConfig(html) {
  const m = /const __ATLAS__=(\{.*?\});\n/s.exec(html);
  assert.ok(m, '__ATLAS__ not found');
  return JSON.parse(m[1]);
}

test('flags default from the registry and reach the page as __ATLAS__.flags', async () => {
  const { host, definition } = await hostWith();
  const { html } = await compileCore(definition, host);
  assert.deepEqual(atlasConfig(html).flags, { highlightRegion: false, budget: 3 });
});

test('a bundle sets flags for its atlases', async () => {
  const { host, definition } = await hostWith({ flags: { highlightRegion: true } });
  const { html } = await compileCore(definition, host);
  assert.deepEqual(atlasConfig(html).flags, { highlightRegion: true, budget: 3 });
});

test('a definition overrides its bundle', async () => {
  const { host, definition } = await hostWith({ flags: { budget: 5 } });
  const { html } = await compileCore({ ...definition, flags: { budget: 9 } }, host);
  assert.equal(atlasConfig(html).flags.budget, 9);
});

test('an unknown flag is an error that names the flag and where it came from', async () => {
  const { host, definition } = await hostWith({ flags: { highlightRegoin: true } });
  await assert.rejects(
    compileCore(definition, host),
    /Unknown flag 'highlightRegoin' in bundle 'calidor'; add it to engine\/flags\.json/
  );
  const clean = await hostWith();
  await assert.rejects(
    compileCore({ ...clean.definition, flags: { nope: 1 } }, clean.host),
    /Unknown flag 'nope' in the definition/
  );
});

test('with an empty registry the page still gets an empty flags object', async () => {
  const { host, definition } = await hostWith({ registry: {} });
  const { html } = await compileCore(definition, host);
  assert.deepEqual(atlasConfig(html).flags, {});
});
