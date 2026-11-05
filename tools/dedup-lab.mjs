#!/usr/bin/env node
// Dedup lab: find out which function variants can be swapped for another without changing what an
// atlas renders. It compiles an atlas with chosen variants substituted, runs the golden tour on
// the result in a child process, and compares it with tests/golden/<atlas>.json.
//
//   node tools/dedup-lab.mjs <atlas> --canonical [--quick] [--bisect] [--only a,b] [--skip a,b]
//   node tools/dedup-lab.mjs <atlas> --swap mountSystem=mountSystem-0123abcd4567
//
// --canonical   swap every function group to its canonical variant (the largest in the group)
// --bisect      if the tour differs, narrow down which functions are unsafe by halving
// --quick       tour every 10th step only (screening; confirm with a full run)
//
// A swap is "safe" for an atlas when every tour step renders exactly as before. Errors usually mean
// the canonical variant calls a helper this atlas does not define; changed steps mean behaviour
// differs for this atlas's data. Steps the tour never reaches are not covered by this check.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Bundle, openBundle } from '../src/bundle.mjs';
import { compileCore } from '../src/compile-core.mjs';
import { createNodeHost } from '../src/compiler.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const atlasId = args.find((a) => !a.startsWith('--'));
const flag = (n) => args.includes('--' + n);
const opt = (n) => {
  const i = args.indexOf('--' + n);
  return i >= 0 ? args[i + 1] : null;
};
if (!atlasId) throw new Error('Usage: dedup-lab.mjs <atlas> [--canonical|--swap name=key] ...');

const index = JSON.parse(await readFile(path.join(root, 'engine/function-index.json'), 'utf8'));
const byName = {};
for (const [key, meta] of Object.entries(index)) (byName[meta.name] ||= []).push(key);
const canonical = (name) =>
  byName[name].reduce((a, b) => (index[b].bytes > index[a].bytes ? b : a));

const host = createNodeHost({ root });
const original = await host.atlas(atlasId);
if (!original) throw new Error('No such atlas bundle: ' + atlasId);
// Build from the same definition the real build uses (maps/<id>.atlas.mjs normalises it).
const definition = (
  await import(pathToFileURL(path.join(root, 'maps', atlasId + '.atlas.mjs')).href)
).default;
const MARKER = /\/\* @atlas-function ([\w-]+) \*\//g;

/** { name: key } for the functions this atlas uses, with their current keys. */
async function currentKeys() {
  const used = {};
  for (const r of original.manifest.parts.runtime ?? [])
    for (const m of (await original.text(r.path)).matchAll(MARKER)) used[index[m[1]].name] = m[1];
  return used;
}

/** Compile the atlas with `swaps` ({ name: key }) applied to its runtime markers. */
async function build(swaps) {
  const files = new Map();
  for (const f of original.files) files.set(f, await original.text(f));
  for (const r of original.manifest.parts.runtime ?? []) {
    files.set(
      r.path,
      files.get(r.path).replace(MARKER, (whole, key) => {
        const to = swaps[index[key].name];
        return to ? `/* @atlas-function ${to} */` : whole;
      })
    );
  }
  const patched = await openBundle(Bundle.fromMap(files), { expectType: 'atlas' });
  const patchedHost = { ...host, atlas: async (id) => (id === atlasId ? patched : host.atlas(id)) };
  return (await compileCore(definition, patchedHost)).html;
}

let runCount = 0;
/** Tour a swapped build in a child process. Returns { ok, errors, changed, total }. */
async function trial(swaps, label) {
  const html = await build(swaps);
  const dir = path.join(root, 'build', 'lab');
  await mkdir(dir, { recursive: true });
  const stem = `${atlasId}-${process.pid}-${++runCount}`;
  const htmlFile = path.join(dir, stem + '.html'),
    outFile = path.join(dir, stem + '.json');
  await writeFile(htmlFile, html);
  const cmd = ['tests/golden.cjs', atlasId, '--html', htmlFile, '--out', outFile];
  if (flag('quick')) cmd.push('--quick');
  const r = spawnSync(process.execPath, cmd, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  let actual;
  try {
    actual = JSON.parse(await readFile(outFile, 'utf8'));
  } catch {
    return {
      ok: false,
      crashed: (r.stderr || r.stdout).slice(0, 300),
      errors: [],
      changed: [],
      total: 0
    };
  }
  const expected = JSON.parse(
    await readFile(
      path.join(root, 'tests/golden', flag('quick') ? 'quick' : '', atlasId + '.json'),
      'utf8'
    )
  );
  const errors = [],
    changed = [];
  if (actual.__load) errors.push('page load  ' + actual.__load);
  for (const [k, v] of Object.entries(actual)) {
    if (k === '__load' || !(k in expected)) continue;
    if (v.startsWith('ERR')) errors.push(`${k}  ${v}`);
    else if (v !== expected[k]) changed.push(k);
  }
  const total = Object.keys(actual).length;
  console.log(
    `  ${label}: ${errors.length || changed.length ? 'DIFFERS' : 'identical'} ` +
      `(${errors.length} errors, ${changed.length} changed of ${total})`
  );
  return { ok: !errors.length && !changed.length, errors, changed, total };
}

// Control: with nothing swapped the lab build must reproduce the golden snapshots exactly,
// otherwise the lab itself is not comparable to the real build and its results mean nothing.
const control = await trial({}, 'control (no swaps)');
if (!control.ok) {
  console.error('The control build differs from the golden snapshots; aborting.');
  process.exit(2);
}

const current = await currentKeys();
let names;
let swaps = {};
if (opt('swap')) {
  for (const pair of args.filter((a, i) => args[i - 1] === '--swap')) {
    const [n, k] = pair.split('=');
    swaps[n] = k;
  }
  names = Object.keys(swaps);
} else {
  const only = opt('only')?.split(',');
  const skip = new Set(opt('skip')?.split(',') ?? []);
  names = Object.keys(current).filter(
    (n) =>
      byName[n].length > 1 &&
      canonical(n) !== current[n] &&
      !skip.has(n) &&
      (!only || only.includes(n))
  );
  for (const n of names) swaps[n] = canonical(n);
}
console.log(`${atlasId}: ${names.length} functions have a different canonical variant`);
if (!names.length) process.exit(0);

const pick = (list) => Object.fromEntries(list.map((n) => [n, swaps[n]]));
const report = { safe: [], unsafe: [] };
const first = await trial(pick(names), `all ${names.length}`);
if (first.ok) report.safe = names;
else if (flag('bisect')) {
  const unsafeDetail = {};
  async function split(list) {
    if (!list.length) return;
    const r = await trial(pick(list), list.length === 1 ? list[0] : `${list.length} functions`);
    if (r.ok) return void report.safe.push(...list);
    if (list.length === 1) {
      report.unsafe.push(list[0]);
      unsafeDetail[list[0]] = r;
      return;
    }
    const mid = list.length >> 1;
    await split(list.slice(0, mid));
    await split(list.slice(mid));
  }
  await split(names);
  if (report.safe.length) {
    const combined = await trial(pick(report.safe), `safe set (${report.safe.length}) combined`);
    if (!combined.ok) console.log('  WARNING: individually safe swaps interact; investigate.');
  }
  for (const n of report.unsafe) {
    const d = unsafeDetail[n];
    console.log(
      `  UNSAFE ${n} -> ${swaps[n]}  (${d.errors.length} errors, ${d.changed.length} changed)`
    );
    for (const line of [...d.errors.slice(0, 2), ...d.changed.slice(0, 2)])
      console.log('      ', line);
  }
} else {
  console.log('  differs; rerun with --bisect to find which functions.');
  for (const line of [...first.errors.slice(0, 3), ...first.changed.slice(0, 3)])
    console.log('   ', line);
}
console.log(JSON.stringify({ atlas: atlasId, safe: report.safe, unsafe: report.unsafe }));
