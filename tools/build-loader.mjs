#!/usr/bin/env node
// Build one self-contained loader document from loader/index.html and the ES modules it uses.
//   node tools/build-loader.mjs [out]      default: build/loader.html
//
// No bundler: modules are wrapped in function scopes and their relative imports become
// destructuring from the already-evaluated module objects. Only the import/export forms this
// repo uses are supported; anything else fails the build rather than being guessed at.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../src/template.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const IMPORT = /^import\s+([\s\S]*?)\s+from\s+'(\.[^']+)';?[ \t]*$/gm;
const EXPORT_DECL =
  /^export\s+((?:async\s+)?(?:function\*?|class|const|let))\s+([A-Za-z_$][\w$]*)/gm;

/** Wrap one module's source; returns { code, deps } where deps are repo-relative paths. */
export function wrapModule(file, source) {
  const deps = [];
  let body = source.replace(IMPORT, (_, spec, from) => {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), from));
    const named = /^\{([\s\S]*)\}$/.exec(spec.trim());
    if (!named) throw new Error(`${file}: only named imports are supported (${spec.trim()})`);
    deps.push(target);
    const names = named[1]
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => n.replace(/\s+as\s+/, ': '));
    return `const { ${names.join(', ')} } = __mods[${JSON.stringify(target)}];`;
  });
  const exported = [];
  body = body.replace(EXPORT_DECL, (_, kind, name) => {
    exported.push(name);
    return `${kind} ${name}`;
  });
  const leftover = /^(?:import|export)\b/m.exec(body);
  if (leftover) throw new Error(`${file}: unsupported import/export form near '${leftover[0]}'`);
  const code = `__mods[${JSON.stringify(file)}] = (() => {\n${body}\nreturn { ${exported.join(', ')} };\n})();`;
  return { code, deps };
}

/** Collect the entry module and everything it imports, dependencies first. */
export async function collectModules(entry) {
  const order = [];
  const seen = new Set();
  async function visit(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const { code, deps } = wrapModule(file, await readFile(path.join(ROOT, file), 'utf8'));
    for (const dep of deps) await visit(dep);
    order.push(code);
  }
  await visit(entry);
  return order;
}

/** The inlined loader script (a classic script, so it also runs in a sandbox without modules). */
export async function buildLoaderScript() {
  const modules = await collectModules('loader/loader.mjs');
  return [
    '(() => {',
    "'use strict';",
    'const __mods = {};',
    ...modules,
    "const { boot } = __mods['loader/loader.mjs'];",
    "boot(JSON.parse(document.getElementById('atlas-loader-config').textContent));",
    '})();'
  ]
    .join('\n')
    .replace(/<\/script/gi, '<\\/script');
}

/**
 * The loader page. @@CONFIG@@ and @@TITLE@@ are left for the host to fill in at serve time;
 * {{...}} slots are build-time.
 */
export async function buildLoader() {
  const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const page = render(
    await readFile(path.join(ROOT, 'loader/index.html'), 'utf8'),
    { version: pkg.version },
    'loader/index.html'
  );
  // Plain replacement: the script text must not pass through the template engine.
  const script = await buildLoaderScript();
  return page.replace('@@LOADER@@', () => script);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(ROOT, 'build', 'loader.html'));
  await mkdir(path.dirname(out), { recursive: true });
  const html = await buildLoader();
  await writeFile(out, html);
  console.log(`${out}: ${Buffer.byteLength(html)} bytes`);
}
