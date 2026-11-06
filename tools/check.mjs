#!/usr/bin/env node
// One command that answers "did this change break anything?".
//
//   node tools/check.mjs                 build, unit tests, DOM tests
//   node tools/check.mjs --e2e           also run the browser tests (Playwright; about 7 minutes)
//
// Exit code 0 only if every step passes.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const e2e = args.includes('--e2e');
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}
function run(name, cmd, cmdArgs, { pass } = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0 && (!pass || pass(out));
  record(name, ok, ok ? '' : out.trim().split('\n').slice(-3).join(' | ').slice(0, 300));
  return ok;
}
const node = process.execPath;

run('function index up to date', node, ['tools/index-functions.mjs', '--check']);
if (!run('build', node, ['tools/build.mjs'])) process.exit(1);
// The DOM tests also load the DSL demo, which the default build does not produce.
run('build DSL demo', node, ['tools/build.mjs', 'examples/new-stellar.atlas.mjs', 'dist']);
// A bundle of bundle.json and atlas.json only, built with the engine's default parts.
run('build minimal atlas', node, ['tools/build.mjs', 'examples/minimal-atlas', 'dist']);
const unitTests = readdirSync(path.join(root, 'tests'))
  .filter((f) => f.endsWith('.test.mjs'))
  .map((f) => 'tests/' + f);
run('unit tests', node, ['--test', ...unitTests], {
  pass: (o) => /ℹ fail 0/.test(o)
});
run('DOM tests', node, ['tests/dom.cjs'], { pass: (o) => (o.match(/^PASS/gm) || []).length >= 8 });
run('IULR DOM tests', node, ['tests/iulr-dom.cjs'], {
  pass: (o) => (o.match(/^PASS/gm) || []).length >= 10
});

if (e2e)
  run('browser tests', node, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test']);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
