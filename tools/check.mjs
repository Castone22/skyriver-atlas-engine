#!/usr/bin/env node
// One command that answers "did this change break anything?".
//
//   node tools/check.mjs                 build, unit tests, DOM tests, quick golden tours
//   node tools/check.mjs --full          the same with the full golden tours (slow: ~10 minutes)
//   node tools/check.mjs --atlas a,b     limit the golden tours to these atlases
//   node tools/check.mjs --e2e           also run the browser tests (Playwright; about 7 minutes)
//   node tools/check.mjs --jobs 1        golden tours at a time (default 2; each uses a lot of memory)
//
// Exit code 0 only if every step passes.
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => (args.includes('--' + n) ? args[args.indexOf('--' + n) + 1] : null);
const full = args.includes('--full');
const atlases = (opt('atlas') ?? 'elysian,uacs,kadaym,iulr,calidor').split(',');
const jobs = Number(opt('jobs') ?? 2);
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

// Golden tours: a few at a time, each in its own process.
const queue = [...atlases];
async function worker() {
  while (queue.length) {
    const id = queue.shift();
    const started = Date.now();
    const cmdArgs = ['tests/golden.cjs', ...(full ? [] : ['--quick']), id];
    const out = await new Promise((resolve) => {
      let buf = '';
      const child = spawn(node, cmdArgs, { cwd: root });
      child.stdout.on('data', (d) => (buf += d));
      child.stderr.on('data', (d) => (buf += d));
      child.on('close', (code) => resolve({ code, buf }));
    });
    const secs = ((Date.now() - started) / 1000).toFixed(0);
    record(
      `golden ${full ? 'full' : 'quick'} ${id}`,
      out.code === 0,
      out.code === 0 ? `${secs}s` : out.buf.trim().split('\n').slice(0, 3).join(' | ').slice(0, 300)
    );
  }
}
await Promise.all(Array.from({ length: jobs }, worker));

if (e2e)
  run('browser tests', node, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test']);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
