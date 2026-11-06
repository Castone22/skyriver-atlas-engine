#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { stat } from 'node:fs/promises';
import { compile, createNodeHost } from '../src/compiler.mjs';
import { loadDirectory } from '../src/bundle-fs.mjs';
import { gallery } from './gallery.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2),
  input = args[0],
  out = path.resolve(args[1] || path.join(root, 'dist'));
// A directory argument is an atlas bundle (bundle.json + atlas.json), built with the engine's defaults.
const bundleDir = input && (await stat(input)).isDirectory() ? path.resolve(input) : null;
const datapack = bundleDir ? await loadDirectory(bundleDir, { expectType: 'atlas' }) : null;
const files = bundleDir
  ? [path.join(bundleDir, datapack.manifest.atlas ?? 'atlas.json')]
  : input
    ? [path.resolve(input)]
    : (await readdir(path.join(root, 'maps')))
        .filter((n) => n.endsWith('.atlas.mjs'))
        .sort()
        .map((n) => path.join(root, 'maps', n));
const loadDefinition = async (file) =>
  file.endsWith('.json')
    ? JSON.parse(await readFile(file, 'utf8'))
    : (await import(pathToFileURL(file).href)).default;
// Atlases that declare dependencies (for example galaxy atlases) build after the others.
const hasDependencies = (definition) => Object.keys(definition.dependencies || {}).length > 0;
const entries = [];
for (const file of files) entries.push({ file, definition: await loadDefinition(file) });
entries.sort((a, b) => hasDependencies(a.definition) - hasDependencies(b.definition));
const dependencies = {},
  report = [],
  kinds = {};
await mkdir(out, { recursive: true });
for (const { definition } of entries) {
  kinds[definition.id] = definition.kind;
  const host = datapack
    ? createNodeHost({ bundles: { [datapack.manifest.id]: datapack } })
    : undefined;
  const result = await compile(definition, { dependencies, ...(host ? { host } : {}) });
  dependencies[definition.id] = result;
  const name = definition.id + '-atlas.html';
  await writeFile(path.join(out, name), result.html);
  report.push({
    id: definition.id,
    file: name,
    bytes: Buffer.byteLength(result.html),
    warnings: result.warnings
  });
  console.log(
    `${name}: ${Buffer.byteLength(result.html)} bytes; ${result.warnings.length} source-data warnings`
  );
}
await writeFile(
  path.join(out, input ? 'build-report-' + report[0].id + '.json' : 'build-report.json'),
  JSON.stringify(report, null, 2) + '\n'
);

if (!input) await gallery(out, report, kinds);
