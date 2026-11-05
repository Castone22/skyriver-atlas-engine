#!/usr/bin/env node
// Prove function variants equivalent without running them.
//
// Each variant in engine/functions is parsed and its local bindings (parameters, let/const/var,
// inner functions, catch parameters) are renamed positionally, so two variants that differ only in
// how locals are spelled normalise to the same tree. Optionally a map of global renames
// (--rename old=new,old=new) is applied first, for names that mean the same thing in different
// atlases (for example federationOverview and overviewMode).
//
// Variants in the same class are equivalent up to those renames. Quote style, whitespace and
// comments never matter.
//
//   node tools/dedup-normalize.mjs                          summary
//   node tools/dedup-normalize.mjs --rename a=b,c=d         with a global rename map
//   node tools/dedup-normalize.mjs --show name              list the classes of one function
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => (args.includes('--' + n) ? args[args.indexOf('--' + n) + 1] : null);
const renames = Object.fromEntries(
  (opt('rename') ?? '')
    .split(',')
    .filter(Boolean)
    .map((p) => p.split('='))
);

const SKIP = new Set([
  'start',
  'end',
  'loc',
  'range',
  'extra',
  'comments',
  'leadingComments',
  'trailingComments',
  'innerComments',
  'tokens',
  'errors'
]);

/** A normalised structural signature of a function source. */
export function signature(source, globalRenames = {}) {
  const ast = parse(source, { sourceType: 'script', errorRecovery: false });
  let counter = 0;
  traverse(ast, {
    Scopable(p) {
      // Rename this scope's own bindings. The top-level function's name stays as it is.
      if (p.isProgram()) return;
      for (const [name, binding] of Object.entries(p.scope.bindings)) {
        if (binding.scope !== p.scope) continue;
        if (p.isFunctionDeclaration() && p.node.id?.name === name && p.parentPath.isProgram())
          continue;
        p.scope.rename(name, `$${counter++}`);
      }
    }
  });
  traverse(ast, {
    Identifier(p) {
      const to = globalRenames[p.node.name];
      if (!to || p.scope.hasBinding(p.node.name, true)) return;
      // Only references and assignment targets: never property names or object keys.
      if (p.parentPath.isMemberExpression({ property: p.node }) && !p.parent.computed) return;
      if (
        p.parentPath.isObjectProperty({ key: p.node }) &&
        !p.parent.computed &&
        !p.parent.shorthand
      )
        return;
      p.node.name = to;
    }
  });
  const text = JSON.stringify(ast.program, (k, v) => (SKIP.has(k) ? undefined : v));
  return createHash('sha1').update(text).digest('hex').slice(0, 10);
}

if (
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('dedup-normalize.mjs')
) {
  const index = JSON.parse(await readFile(path.join(root, 'engine/function-index.json'), 'utf8'));
  const byName = {};
  for (const [key, meta] of Object.entries(index)) (byName[meta.name] ||= []).push(key);
  let variants = 0,
    classes = 0,
    failed = 0;
  const show = opt('show');
  const rows = [];
  for (const [name, keys] of Object.entries(byName)) {
    const buckets = new Map();
    for (const key of keys) {
      const src = await readFile(path.join(root, 'engine/functions', key + '.js'), 'utf8');
      let sig;
      try {
        sig = signature(src, renames);
      } catch (e) {
        failed++;
        sig = 'unparsed:' + key;
      }
      if (!buckets.has(sig)) buckets.set(sig, []);
      buckets.get(sig).push(key);
    }
    variants += keys.length;
    classes += buckets.size;
    rows.push({
      name,
      variants: keys.length,
      classes: buckets.size,
      buckets: [...buckets.values()]
    });
    if (show === name)
      for (const b of buckets.values())
        console.log(b.map((k) => `${k} [${index[k].profiles}]`).join('\n   '), '\n');
  }
  if (!show) {
    const merged = rows.filter((r) => r.classes < r.variants);
    console.log(
      `function variants: ${variants}; distinct after normalisation: ${classes}; unparsed: ${failed}`
    );
    console.log(`files that would merge: ${variants - classes}`);
    for (const r of merged.sort((a, b) => b.variants - b.classes - (a.variants - a.classes)))
      console.log(`  ${r.name.padEnd(24)} ${r.variants} variants -> ${r.classes} classes`);
  }
}
