import test from 'node:test';
import assert from 'node:assert/strict';
import { compileCore } from '../src/compile-core.mjs';
import { createNodeHost } from '../src/compiler.mjs';

const disk = createNodeHost();

/** Wrap a real bundle with extra manifest fields. */
const withManifest = (bundle, extra) => {
  const wrapped = Object.create(bundle);
  wrapped.manifest = { ...bundle.manifest, ...extra };
  return wrapped;
};

test('a non-string bundle slot is rejected', async () => {
  const real = await disk.atlas('calidor');
  const definition = await real.json('atlas.json');
  await assert.rejects(
    compileCore(definition, {
      ...disk,
      atlas: async () => withManifest(real, { slots: { x: 1 } })
    }),
    /slot 'x' must be a string/
  );
});

test('bundle slots are available to shells and may use {{brand}}', async () => {
  const real = await disk.atlas('calidor');
  const definition = await real.json('atlas.json');
  const shell = await real.text('shell.html');
  const patched = Object.create(real);
  patched.manifest = {
    ...real.manifest,
    slots: { ...real.manifest.slots, greeting: 'Hello {{brand}}' }
  };
  patched.text = async (p) => (p === 'shell.html' ? '{{greeting|html}}' + shell : real.text(p));
  const { html } = await compileCore(definition, { ...disk, atlas: async () => patched });
  assert.ok(html.startsWith('Hello ' + real.manifest.brand));
});
