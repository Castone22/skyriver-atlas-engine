#!/usr/bin/env node
// Build the zips to upload to the AtlasEmbed extension.
//
//   node tools/pack.mjs                 engine and every datapack
//   node tools/pack.mjs engine          the engine only
//   node tools/pack.mjs datapacks       every datapack (bundles/<id>) with `files` digests
//   node tools/pack.mjs datapack <id>   one datapack
//   --out <dir>                         default: build/pack
//
// The engine zip also carries every image any bundle uses, so the extension needs no asset store: each
// image is a base64 text file, assets/<sha256>.b64, listed in the engine's bundle.json under `assets`
// (see docs/TRANSPORTS.md). Nothing here is committed: `files` digests belong to the exact contents.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateManifest } from './bundle-manifest.mjs';
import { loadDirectory } from '../src/bundle-fs.mjs';
import { verifyFiles } from '../src/bundle.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** Every image hash named by `atlas-asset:<sha256>` in any file of any bundle under `bundles/`. */
export async function referencedAssets(root = ROOT) {
  const found = new Set();
  const dir = path.join(root, 'bundles');
  for (const id of await readdir(dir))
    for (const name of await readdir(path.join(dir, id))) {
      const text = await readFile(path.join(dir, id, name), 'utf8');
      for (const m of text.matchAll(/atlas-asset:([a-f0-9]{64})/g)) found.add(m[1]);
    }
  return [...found].sort();
}

/** Zip the contents of `dir` into `file`. */
export function zipDirectory(dir, file) {
  const run =
    process.platform === 'win32'
      ? spawnSync(
          'powershell',
          [
            '-NoProfile',
            '-Command',
            `Compress-Archive -Path '${dir}\\*' -DestinationPath '${file}' -CompressionLevel Optimal -Force`
          ],
          { encoding: 'utf8' }
        )
      : spawnSync('zip', ['-qr', path.resolve(file), '.'], { cwd: dir, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`Could not zip ${dir}: ${run.stderr || run.stdout}`);
}

/** Lay out the engine, with its images, in `outDir` and give it fresh digests. Returns the manifest. */
export async function stageEngine(outDir, root = ROOT) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp(path.join(root, 'engine'), outDir, { recursive: true });
  const library = JSON.parse(await readFile(path.join(root, 'assets', 'manifest.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(outDir, 'bundle.json'), 'utf8'));
  manifest.assets = {};
  await mkdir(path.join(outDir, 'assets'), { recursive: true });
  for (const hash of await referencedAssets(root)) {
    const entry = library[hash];
    if (!entry)
      throw new Error(`Image ${hash} is used by a bundle but is not in assets/manifest.json`);
    const bytes = await readFile(path.join(root, entry.file));
    if (createHash('sha256').update(bytes).digest('hex') !== hash)
      throw new Error(`assets/${path.basename(entry.file)} does not match its name`);
    await writeFile(path.join(outDir, 'assets', `${hash}.b64`), bytes.toString('base64'));
    manifest.assets[hash] = { file: `assets/${hash}.b64`, mime: entry.mime };
  }
  await writeFile(path.join(outDir, 'bundle.json'), JSON.stringify(manifest, null, 2) + '\n');
  await updateManifest(outDir);
  const bundle = await loadDirectory(outDir, { expectType: 'engine' });
  const problems = await verifyFiles(bundle);
  if (problems.length) throw new Error('Engine digests do not match:\n' + problems.join('\n'));
  return bundle.manifest;
}

/** Lay out one datapack in `outDir` with fresh digests. Returns its manifest. */
export async function stageDatapack(id, outDir, root = ROOT) {
  await rm(outDir, { recursive: true, force: true });
  await cp(path.join(root, 'bundles', id), outDir, { recursive: true });
  await updateManifest(outDir);
  const bundle = await loadDirectory(outDir, { expectType: 'atlas' });
  const problems = await verifyFiles(bundle);
  if (problems.length)
    throw new Error(`Datapack ${id}: digests do not match:\n` + problems.join('\n'));
  return bundle.manifest;
}

async function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const out = path.resolve(ROOT, outIndex >= 0 ? args[outIndex + 1] : 'build/pack');
  const words = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
  const what = words[0] ?? 'all';
  const stage = path.join(out, '.stage');
  await mkdir(out, { recursive: true });
  const report = [];
  if (what === 'all' || what === 'engine') {
    const m = await stageEngine(path.join(stage, 'engine'));
    const file = path.join(out, `atlas-engine-${m.version}.zip`);
    await rm(file, { force: true });
    zipDirectory(path.join(stage, 'engine'), file);
    report.push([
      file,
      `${Object.keys(m.files).length} files, ${Object.keys(m.assets).length} images`
    ]);
  }
  if (what === 'all' || what === 'datapacks' || what === 'datapack') {
    const ids = what === 'datapack' ? [words[1]] : await readdir(path.join(ROOT, 'bundles'));
    for (const id of ids) {
      if (!id || !(await stat(path.join(ROOT, 'bundles', id)).catch(() => null)))
        throw new Error(`No such bundle: ${id}`);
      const m = await stageDatapack(id, path.join(stage, id));
      const file = path.join(out, `${id}-datapack-${m.version}.zip`);
      await rm(file, { force: true });
      zipDirectory(path.join(stage, id), file);
      report.push([file, `${Object.keys(m.files).length} files`]);
    }
  }
  await rm(stage, { recursive: true, force: true });
  for (const [file, note] of report) {
    const size = (await stat(file)).size;
    console.log(`${path.relative(ROOT, file)}  ${(size / 1024).toFixed(0)} KB  (${note})`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
