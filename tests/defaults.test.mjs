import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Bundle, openBundle, validateManifest } from '../src/bundle.mjs';
import { loadDirectory } from '../src/bundle-fs.mjs';
import { createNodeHost, compile } from '../src/compiler.mjs';

// An atlas bundle needs only bundle.json and atlas.json. The engine supplies a default shell, style
// and runtime for its kind, plus default slots, flags and policies.
const atlasDir = new URL('../examples/minimal-atlas/', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1'
);
const definition = async () => JSON.parse(await readFile(`${atlasDir}atlas.json`, 'utf8'));

test('an atlas with only bundle.json and atlas.json compiles with the default parts', async () => {
  const bundle = await loadDirectory(atlasDir, { expectType: 'atlas' });
  assert.deepEqual(bundle.files.sort(), ['atlas.json', 'bundle.json']);
  const host = createNodeHost({ bundles: { minimal: bundle } });
  const { html } = await compile(await definition(), { host });
  assert.match(html, /<title>Minimal Atlas · Stellar Atlas<\/title>/);
  assert.match(html, /Demonstration Atlas/);
  assert.ok(!html.includes('@@'), 'unresolved placeholder');
  assert.ok(!/\{\{[a-zA-Z]+(\|\w+)?\}\}/.test(html), 'unrendered slot');
  // The default runtime's flags and policies are assumed.
  assert.match(html, /"regionLabelStyle":"ink-title"/);
  assert.match(html, /"nodeScale"/);
});

test('a part the bundle supplies replaces only that part', async () => {
  const dir = await loadDirectory(atlasDir, { expectType: 'atlas' });
  const manifest = {
    ...dir.manifest,
    parts: { shell: 'shell.html' }
  };
  const shell = (
    await readFile(new URL('../engine/defaults/stellar/shell.html', import.meta.url), 'utf8')
  ).replace('<h1>', '<h1 id="custom-shell">');
  const bundle = await openBundle(
    Bundle.fromMap({
      'bundle.json': JSON.stringify(manifest),
      'atlas.json': await readFile(`${atlasDir}atlas.json`, 'utf8'),
      'shell.html': shell
    })
  );
  const host = createNodeHost({ bundles: { minimal: bundle } });
  const { html } = await compile(await definition(), { host });
  assert.match(html, /id="custom-shell"/);
  // The style and runtime still come from the engine.
  assert.match(html, /\.node-label/);
  assert.match(html, /function regionOverview\(\)/);
});

test('slots default from the engine and the bundle overrides them', async () => {
  const dir = await loadDirectory(atlasDir, { expectType: 'atlas' });
  const bundle = await openBundle(
    Bundle.fromMap({
      'bundle.json': JSON.stringify({ ...dir.manifest, slots: { nationNoun: 'Republic' } }),
      'atlas.json': await readFile(`${atlasDir}atlas.json`, 'utf8')
    })
  );
  const host = createNodeHost({ bundles: { minimal: bundle } });
  const { html } = await compile(await definition(), { host });
  assert.match(html, /Republic holdings/);
});

test('engine defaults must point at files the engine has', () => {
  const engine = {
    bundleVersion: 1,
    type: 'engine',
    version: '1.0.0',
    kinds: ['stellar'],
    defaults: { stellar: { parts: { shell: 'defaults/stellar/shell.html' } } }
  };
  assert.deepEqual(validateManifest(engine, ['bundle.json', 'defaults/stellar/shell.html']), []);
  assert.match(validateManifest(engine, ['bundle.json']).join(), /missing file/);
  assert.match(
    validateManifest({ ...engine, defaults: { geographic: {} } }, ['bundle.json']).join(),
    /does not support kind 'geographic'/
  );
});
