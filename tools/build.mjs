#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { compile } from '../src/compiler.mjs';
import { gallery } from './gallery.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2),
  input = args[0],
  out = path.resolve(args[1] || path.join(root, 'dist'));
const files = input
  ? [path.resolve(input)]
  : (await readdir(path.join(root, 'maps')))
      .filter((n) => n.endsWith('.atlas.mjs'))
      .sort(
        (a, b) =>
          (a.startsWith('grand') ? 1 : 0) - (b.startsWith('grand') ? 1 : 0) || a.localeCompare(b)
      )
      .map((n) => path.join(root, 'maps', n));
const dependencies = {},
  report = [];
await mkdir(out, { recursive: true });
for (const file of files) {
  const definition = file.endsWith('.json')
    ? JSON.parse(await readFile(file, 'utf8'))
    : (await import(pathToFileURL(file).href)).default;
  const result = await compile(definition, { dependencies });
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

if (!input) await gallery(out, report);
