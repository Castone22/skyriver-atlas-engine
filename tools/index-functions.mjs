#!/usr/bin/env node
// Rebuild engine/function-index.json from the files, so it never needs hand-merging.
//
//   node tools/index-functions.mjs               rewrite the index
//   node tools/index-functions.mjs --check       exit 1 if the index differs (no writes)
//   node tools/index-functions.mjs --prune       also delete function files no bundle links
//   node tools/index-functions.mjs --fix-names   rename files whose prefix is not their function
//                                                name, and update every marker that points at them
//   node tools/index-functions.mjs --unhash      drop the suffix from functions that have a single
//                                                linked file (<name>-abc123.js -> <name>.js)
//
// name     the first top-level function declared in the file (else the file name prefix)
// profiles the atlas bundles whose runtime scripts link the file
// bytes    size of the source without its trailing newline
import { readFile, readdir, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes('--' + n);
const MARKER = /\/\* @atlas-function ([\w-]+) \*\//g;
const fnDir = path.join(root, 'engine/functions');

const files = (await readdir(fnDir)).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3));
const nameOf = async (key) => {
  const src = await readFile(path.join(fnDir, key + '.js'), 'utf8');
  try {
    const first = parse(src, { sourceType: 'script' }).program.body.find(
      (n) => n.type === 'FunctionDeclaration'
    );
    if (first?.id) return { name: first.id.name, src };
  } catch {
    // fall through to the file name
  }
  return { name: key.replace(/-[^-]+$/, ''), src };
};

async function runtimeFiles() {
  const out = [];
  for (const id of await readdir(path.join(root, 'bundles')))
    for (const f of (await readdir(path.join(root, 'bundles', id))).filter((x) =>
      /^runtime-\d+\.js$/.test(x)
    ))
      out.push({ id, file: path.join(root, 'bundles', id, f) });
  return out;
}

let names = {};
for (const key of files) names[key] = await nameOf(key);

if (flag('fix-names')) {
  const renames = {};
  for (const key of files) {
    // A file already named exactly after its function has no suffix to keep.
    if (key === names[key].name) continue;
    const hash = key.slice(key.lastIndexOf('-') + 1);
    const wanted = `${names[key].name}-${hash}`;
    if (wanted !== key) renames[key] = wanted;
  }
  for (const [from, to] of Object.entries(renames)) {
    if (files.includes(to)) throw new Error(`Cannot rename ${from}: ${to} already exists`);
    await rename(path.join(fnDir, from + '.js'), path.join(fnDir, to + '.js'));
  }
  for (const { file } of await runtimeFiles()) {
    const text = await readFile(file, 'utf8');
    const next = text.replace(MARKER, (whole, key) =>
      renames[key] ? `/* @atlas-function ${renames[key]} */` : whole
    );
    if (next !== text) await writeFile(file, next);
  }
  console.log(`renamed ${Object.keys(renames).length} function files`);
  for (const [a, b] of Object.entries(renames)) console.log(`  ${a} -> ${b}`);
  // Re-read after renames.
  const again = (await readdir(fnDir)).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3));
  files.length = 0;
  files.push(...again);
  names = {};
  for (const key of files) names[key] = await nameOf(key);
}

const usage = {};
for (const { id, file } of await runtimeFiles())
  for (const m of (await readFile(file, 'utf8')).matchAll(MARKER))
    (usage[m[1]] ||= new Set()).add(id);

const missing = Object.keys(usage).filter((k) => !files.includes(k));
if (missing.length)
  throw new Error('Markers point at missing function files: ' + missing.join(', '));

const orphans = files.filter((k) => !usage[k]);
if (orphans.length) {
  if (flag('prune')) {
    for (const k of orphans) await unlink(path.join(fnDir, k + '.js'));
    console.log(`pruned ${orphans.length} unlinked function files`);
  } else console.log(`warning: ${orphans.length} unlinked function files: ${orphans.join(', ')}`);
}

// A name with a single linked file needs no suffix: its file is just `<name>.js`. The suffix only
// tells variants apart while a function still has more than one.
if (flag('unhash')) {
  const linked = files.filter((k) => usage[k]);
  const count = {};
  for (const k of linked) count[names[k].name] = (count[names[k].name] || 0) + 1;
  const renames = {};
  for (const k of linked) {
    const name = names[k].name;
    if (count[name] === 1 && k !== name) {
      if (files.includes(name)) throw new Error(`Cannot rename ${k}: ${name}.js already exists`);
      renames[k] = name;
    }
  }
  for (const [from, to] of Object.entries(renames)) {
    await rename(path.join(fnDir, from + '.js'), path.join(fnDir, to + '.js'));
    files[files.indexOf(from)] = to;
    names[to] = names[from];
    usage[to] = usage[from];
    delete usage[from];
  }
  for (const { file } of await runtimeFiles()) {
    const text = await readFile(file, 'utf8');
    const next = text.replace(MARKER, (whole, key) =>
      renames[key] ? `/* @atlas-function ${renames[key]} */` : whole
    );
    if (next !== text) await writeFile(file, next);
  }
  console.log(`dropped the suffix from ${Object.keys(renames).length} function files`);
}

const index = {};
for (const key of files.filter((k) => usage[k]).sort())
  index[key] = {
    name: names[key].name,
    profiles: [...usage[key]].sort(),
    bytes: Buffer.byteLength(names[key].src.trimEnd())
  };
const text = JSON.stringify(index, null, 2) + '\n';
const indexFile = path.join(root, 'engine/function-index.json');
const current = await readFile(indexFile, 'utf8').catch(() => '');
if (flag('check')) {
  console.log(current === text ? 'function index is up to date' : 'function index is out of date');
  process.exit(current === text ? 0 : 1);
}
await writeFile(indexFile, text);
console.log(`indexed ${Object.keys(index).length} function files`);
