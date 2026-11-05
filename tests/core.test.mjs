import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Atlas, validate, articleURL, assertJSON } from '../src/atlas.mjs';
import { compile } from '../src/compiler.mjs';
import { FileAtlasStore } from '../src/store.mjs';
const make = () =>
  Atlas.stellar({ id: 'test', title: 'Test', article: 'Test Atlas' })
    .extent(0, 0, 1000, 1000)
    .region('reach', { name: 'Reach' }, (r) =>
      r.system('sun', { name: 'Sun', x: 100, y: 100 }, (s) =>
        s.planet('Sun III', { orbitalPosition: 3 }, (p) =>
          p.moon('Moon').station('Orbital', { category: 'Habitation' })
        )
      )
    );
test('DSL preserves stable names, parentage, extensible data and serializable round trips', () => {
  const d = make().build();
  assert.equal(d.data.satellites[0].parent, 'Sun III');
  assert.equal(d.data.stations[0].system, 'sun');
  assert.deepEqual(Atlas.fromJSON(JSON.stringify(d)).build(), d);
  assert.equal(d.data.worlds['Sun III'].articleTitle, 'Sun III');
});
test('authoring errors fail before rendering', () => {
  assert.throws(() => make().region('reach'), /Duplicate/);
  const b = make().update('systems', 'sun', { region: 'missing' });
  assert.throws(() => b.build(), /unknown region/);
  assert.equal(validate(b.toJSON(), { strict: false }).warnings.length, 1);
  assert.throws(
    () => Atlas.fromJSON({ ...make().build(), schemaVersion: 999 }).build(),
    /schemaVersion/
  );
  assert.throws(
    () =>
      make()
        .catalogue({ atlasExtent: [0, 0, -5, 1] })
        .build(),
    /atlasExtent/
  );
});
test('JSON contracts reject executable data, cycles, nonfinite numbers and prototype keys', () => {
  for (const x of [() => {}, NaN, undefined, new Date()]) assert.throws(() => assertJSON(x));
  const o = {};
  o.x = o;
  assert.throws(() => assertJSON(o), /circular/);
  assert.throws(() => assertJSON(JSON.parse('{"__proto__":{}}')), /reserved/);
});
test('article URLs handle missing pages, page IDs, sections and encoded names', () => {
  assert.match(articleURL('Bellhop Starport'), /title=Bellhop_Starport/);
  assert.match(articleURL('Name', { pageid: 345 }), /curid=345/);
  assert.equal(
    new URL(articleURL('A & B', { section: 'Dock 2' })).searchParams.get('title'),
    'A_&_B'
  );
});
test('file repository supports revision guards and atomic updates', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'atlas-test-'));
  try {
    const store = new FileAtlasStore(dir),
      d = make().build();
    const first = await store.save(d, { expectedRevision: 0 });
    assert.equal(first.revision, 1);
    await assert.rejects(store.save(d, { expectedRevision: 0 }), /Revision conflict/);
    assert.equal((await store.save(d, { expectedRevision: 1 })).revision, 2);
    assert.deepEqual(await store.list(), ['test']);
    assert.deepEqual((await store.load('test')).definition, d);
    assert.throws(() => store._path('../x'), /Invalid/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('portable build links shared functions and accepts new catalogues', async () => {
  const result = await compile(make().build());
  assert.match(result.html, /Sun III/);
  assert.match(result.html, /<option value="reach">Reach<\/option>/);
  assert.doesNotMatch(result.html, /@atlas-function|@@RUNTIME/);
  assert.match(result.html, /window.AtlasFramework/);
  assert.doesNotMatch(result.html, /Codex sources reviewed 1 November/);
});
test('data cannot close script tags in the generated document', async () => {
  const d = make()
    .meta({ title: '</title><script>alert(1)</script>' })
    .update('worlds', 'Sun III', { description: '</script><script>alert(2)</script>' })
    .build();
  const { html } = await compile(d);
  assert.doesNotMatch(html, /<script>alert\([12]\)/);
});
test('unimplemented feature switches fail rather than silently doing nothing', async () => {
  await assert.rejects(compile(make().feature('unknown').build()), /not supported/);
  await assert.rejects(compile(make().feature('labels', {}).build()), /labels.overview.active/);
});
test('all seven migrated definitions retain their catalogue counts', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../docs/source-manifest.json', import.meta.url))
  );
  for (const entry of manifest) {
    const d = JSON.parse(await readFile(new URL('../data/' + entry.id + '.json', import.meta.url)));
    assert.equal(validate(d, { strict: false }).valid, true, entry.id);
    if (entry.systems !== undefined) {
      assert.equal(d.data.systems.length, entry.systems);
      assert.equal(Object.keys(d.data.worlds).length, entry.worlds);
      assert.equal(d.data.satellites.length, entry.satellites);
      assert.equal(d.data.stations.length, entry.stations);
    }
  }
});
