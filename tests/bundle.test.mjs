import test from 'node:test';
import assert from 'node:assert/strict';
import { Bundle, openBundle, validateManifest, isSafePath, satisfies } from '../src/bundle.mjs';

const manifest = (over = {}) => ({
  bundleVersion: 1,
  type: 'atlas',
  id: 'demo',
  version: '1.0.0',
  engine: '^1.0.0',
  kind: 'stellar',
  brand: 'Demo',
  parts: { shell: 'shell.html', styles: ['style.css'], runtime: [{ path: 'run.js', attrs: '' }] },
  ...over
});
const tree = (m = manifest(), extra = {}) =>
  Bundle.fromMap({
    'bundle.json': JSON.stringify(m),
    'atlas.json': '{}',
    'shell.html': '<html></html>',
    'style.css': '',
    'run.js': '',
    ...extra
  });

test('safe paths reject traversal and odd forms', () => {
  for (const ok of ['a.js', 'functions/a.js', 'a/b/c.css']) assert.ok(isSafePath(ok), ok);
  for (const bad of ['', '/a', '../a', 'a/../b', 'a//b', 'a\\b', './a', 'a/', 'a\0b'])
    assert.ok(!isSafePath(bad), JSON.stringify(bad));
});

test('satisfies handles *, exact and caret ranges', () => {
  assert.ok(satisfies('1.4.2', '^1.0.0'));
  assert.ok(!satisfies('2.0.0', '^1.0.0'));
  assert.ok(!satisfies('0.9.9', '^1.0.0'));
  assert.ok(satisfies('0.2.5', '^0.2.1'));
  assert.ok(!satisfies('0.3.0', '^0.2.1'));
  assert.ok(satisfies('1.0.0', '1.0.0') && !satisfies('1.0.1', '1.0.0'));
  assert.ok(satisfies('9.9.9', '*'));
  assert.throws(() => satisfies('1.0.0', '>=1'), /Invalid version range/);
  assert.throws(() => satisfies('x', '*'), /Invalid version/);
});

test('a valid atlas bundle opens and exposes its manifest and files', async () => {
  const b = await openBundle(tree(), { expectType: 'atlas' });
  assert.equal(b.manifest.id, 'demo');
  assert.equal(await b.text('shell.html'), '<html></html>');
  assert.deepEqual(await b.json('atlas.json'), {});
  await assert.rejects(b.text('nope.js'), /not found/);
});

test('validation reports every problem, not just the first', () => {
  const errors = validateManifest(
    manifest({
      bundleVersion: 2,
      id: 'Bad Id',
      kind: 'flat',
      engine: 'latest',
      parts: { shell: '../x.html', styles: ['gone.css'], runtime: [{}] }
    }),
    ['atlas.json']
  );
  const text = errors.join('\n');
  for (const piece of [
    'bundleVersion',
    'Invalid id',
    'Unknown kind',
    'engine range',
    'unsafe path',
    'missing file',
    'need a path'
  ])
    assert.match(text, new RegExp(piece));
});

test('declared parts must exist', async () => {
  const b = Bundle.fromMap({ 'bundle.json': JSON.stringify(manifest()), 'atlas.json': '{}' });
  await assert.rejects(openBundle(b), /missing file 'shell\.html'/);
});

test('type is enforced when expected', async () => {
  await assert.rejects(openBundle(tree(), { expectType: 'engine' }), /Expected a engine bundle/);
});

test('engine bundles need a version and kinds', async () => {
  const engine = (m) => Bundle.fromMap({ 'bundle.json': JSON.stringify(m) });
  const ok = { bundleVersion: 1, type: 'engine', version: '1.0.0', kinds: ['stellar'] };
  assert.equal((await openBundle(engine(ok))).manifest.type, 'engine');
  await assert.rejects(openBundle(engine({ ...ok, kinds: ['flat'] })), /kinds/);
  await assert.rejects(openBundle(engine({ ...ok, version: '1' })), /version/);
});

test('missing or malformed bundle.json is a clear error', async () => {
  await assert.rejects(openBundle(Bundle.fromMap({})), /bundle\.json is missing/);
  await assert.rejects(openBundle(Bundle.fromMap({ 'bundle.json': '{' })), /not valid JSON/);
});

test('an engine id is optional but must be a valid id', async () => {
  const engine = (m) => Bundle.fromMap({ 'bundle.json': JSON.stringify(m) });
  const ok = { bundleVersion: 1, type: 'engine', version: '1.0.0', kinds: ['stellar'] };
  assert.equal((await openBundle(engine({ ...ok, id: 'surface-map' }))).manifest.id, 'surface-map');
  assert.equal((await openBundle(engine(ok))).manifest.id, undefined);
  await assert.rejects(openBundle(engine({ ...ok, id: 'Bad Id' })), /Invalid engine id/);
});
