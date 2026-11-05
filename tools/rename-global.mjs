#!/usr/bin/env node
// Rename a global identifier in one atlas bundle's runtime scripts and in the function files it
// links, using the syntax tree so that strings, property names and local variables of the same
// name are never touched. Edits are made in place on the original text (no reformatting).
//
//   node tools/rename-global.mjs <atlas> <old> <new> [--dry-run]
//
// A function file shared with other atlases is only renamed if every other atlas that links it is
// also listed with --also (otherwise the tool stops, because renaming would break them).
// The function index entry names (`name`) are updated when a function declaration is renamed.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const [atlas, oldName, newName] = args.filter((a) => !a.startsWith('--'));
const dry = args.includes('--dry-run');
const also = new Set(args.filter((a, i) => args[i - 1] === '--also').flatMap((a) => a.split(',')));
if (!atlas || !oldName || !newName) throw new Error('Usage: rename-global.mjs <atlas> <old> <new>');
const MARKER = /\/\* @atlas-function ([\w-]+) \*\//g;

/** Character offsets of every global reference or declaration of `name` in `source`. */
function occurrences(source, name) {
  const ast = parse(source, { sourceType: 'script' });
  const spots = [];
  const problems = [];
  traverse(ast, {
    Identifier(p) {
      if (p.node.name !== name) return;
      const parent = p.parent;
      if (p.parentPath.isMemberExpression({ property: p.node }) && !parent.computed) return;
      // In {name} shorthand the key and value are two nodes at the same position. Keep the key and
      // rename only the variable it reads, by expanding to `name: newName`.
      if (p.parentPath.isObjectProperty({ key: p.node }) && !parent.computed) return;
      const shorthandValue = p.parentPath.isObjectProperty({ value: p.node }) && parent.shorthand;
      if (p.parentPath.isObjectMethod({ key: p.node }) && !parent.computed) return;
      if (
        p.parentPath.isLabeledStatement() ||
        p.parentPath.isBreakStatement() ||
        p.parentPath.isContinueStatement()
      )
        return;
      // Skip names bound locally (a local variable that happens to share the name).
      const binding = p.scope.getBinding(name);
      if (binding && binding.scope.path.type !== 'Program') return;
      spots.push({ at: p.node.start, shorthand: shorthandValue });
    }
  });
  return { spots, problems };
}
const apply = (source, spots, from, to) => {
  let out = source;
  for (const { at, shorthand } of [...spots].sort((a, b) => b.at - a.at))
    out = out.slice(0, at) + (shorthand ? `${from}: ${to}` : to) + out.slice(at + from.length);
  return out;
};

const index = JSON.parse(await readFile(path.join(root, 'engine/function-index.json'), 'utf8'));
const dir = path.join(root, 'bundles', atlas);
const edits = []; // { file, source }
const problems = [];

// Runtime scripts of the atlas.
const used = new Set();
for (const f of (await readdir(dir)).filter((x) => /^runtime-\d+\.js$/.test(x))) {
  const file = path.join(dir, f);
  const source = await readFile(file, 'utf8');
  for (const m of source.matchAll(MARKER)) used.add(m[1]);
  const { spots, problems: p } = occurrences(source, oldName);
  problems.push(...p.map((x) => `${f}: ${x}`));
  if (spots.length)
    edits.push({
      file,
      label: `bundles/${atlas}/${f}`,
      source: apply(source, spots, oldName, newName),
      count: spots.length
    });
}
// Function files linked by the atlas.
for (const key of used) {
  const file = path.join(root, 'engine/functions', key + '.js');
  const source = await readFile(file, 'utf8');
  const { spots, problems: p } = occurrences(source, oldName);
  problems.push(...p.map((x) => `${key}: ${x}`));
  if (!spots.length) continue;
  const others = index[key].profiles.filter((x) => x !== atlas && !also.has(x));
  if (others.length)
    problems.push(`${key} is also linked by ${others.join(', ')}; pass --also to include them`);
  edits.push({
    file,
    label: `engine/functions/${key}.js`,
    source: apply(source, spots, oldName, newName),
    count: spots.length,
    key
  });
}
if (problems.length) {
  console.error('Not renaming:\n- ' + problems.join('\n- '));
  process.exit(1);
}
for (const e of edits) console.log(`${dry ? 'would edit' : 'edit'} ${e.label}: ${e.count}`);
if (!dry) {
  for (const e of edits) await writeFile(e.file, e.source);
  // A renamed function declaration changes the function's name in the index.
  let changed = false;
  for (const e of edits.filter((x) => x.key))
    if (index[e.key].name === oldName) {
      index[e.key].name = newName;
      changed = true;
    }
  if (changed)
    await writeFile(
      path.join(root, 'engine/function-index.json'),
      JSON.stringify(index, null, 2) + '\n'
    );
}
