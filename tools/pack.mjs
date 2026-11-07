#!/usr/bin/env node
// Build the zips to upload to the AtlasEmbed extension.
//
//   node tools/pack.mjs                 engine, every datapack and the images
//   node tools/pack.mjs engine          the engine only
//   node tools/pack.mjs datapacks       every datapack (bundles/<id>) with `files` digests
//   node tools/pack.mjs datapack <id>   one datapack
//   node tools/pack.mjs assets          the images the bundles use, named by SHA-256
//   --out <dir>                         default: build/pack
//
// Nothing here is committed: `files` digests belong to the exact contents of a build.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateManifest } from './bundle-manifest.mjs';
import { loadDirectory } from '../src/bundle-fs.mjs';
import { verifyFiles } from '../src/bundle.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** Every image hash named by `atlas-asset:<sha256>` in any bundle, with the bundles that use it. */
export async function referencedAssets(root = ROOT) {
  const found = new Map();
  const dir = path.join(root, 'bundles');
  for (const id of await readdir(dir))
    for (const name of await readdir(path.join(dir, id))) {
      const text = await readFile(path.join(dir, id, name), 'utf8');
      for (const m of text.matchAll(/atlas-asset:([a-f0-9]{64})/g))
        found.set(m[1], [...new Set([...(found.get(m[1]) ?? []), id])]);
    }
  return found;
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

/** Lay out a bundle directory in `outDir` with fresh `files` digests; returns its manifest. */
async function stageBundle(source, outDir, type) {
  await rm(outDir, { recursive: true, force: true });
  await cp(source, outDir, { recursive: true });
  await updateManifest(outDir);
  const bundle = await loadDirectory(outDir, { expectType: type });
  const problems = await verifyFiles(bundle);
  if (problems.length) throw new Error(`${source}: digests do not match:\n${problems.join('\n')}`);
  return bundle.manifest;
}
/**
 * Lay out the engine in `outDir`, with a pack of its function library: one file, functions.pack.json, so a
 * loader fetches the ~200 small function files in one request instead of one each.
 */
export async function stageEngine(outDir, root = ROOT) {
  await rm(outDir, { recursive: true, force: true });
  await cp(path.join(root, 'engine'), outDir, { recursive: true });
  const contents = {};
  for (const name of (await readdir(path.join(outDir, 'functions'))).sort())
    contents[`functions/${name}`] = await readFile(path.join(outDir, 'functions', name), 'utf8');
  await writeFile(path.join(outDir, 'functions.pack.json'), JSON.stringify(contents));
  const manifest = JSON.parse(await readFile(path.join(outDir, 'bundle.json'), 'utf8'));
  manifest.pack = { file: 'functions.pack.json', prefix: 'functions/' };
  await writeFile(path.join(outDir, 'bundle.json'), JSON.stringify(manifest, null, 2) + '\n');
  await updateManifest(outDir);
  const bundle = await loadDirectory(outDir, { expectType: 'engine' });
  const problems = await verifyFiles(bundle);
  if (problems.length) throw new Error(`engine: digests do not match:\n${problems.join('\n')}`);
  return bundle.manifest;
}
export const stageDatapack = (id, outDir, root = ROOT) =>
  stageBundle(path.join(root, 'bundles', id), outDir, 'atlas');

/** Copy the images the bundles use into `outDir`, named `<sha256>.<ext>`, with assets.json. */
export async function stageAssets(outDir, root = ROOT) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const library = JSON.parse(await readFile(path.join(root, 'assets', 'manifest.json'), 'utf8'));
  const index = {};
  for (const [hash, usedBy] of await referencedAssets(root)) {
    const entry = library[hash];
    if (!entry)
      throw new Error(`Image ${hash} is used by a bundle but is not in assets/manifest.json`);
    const bytes = await readFile(path.join(root, entry.file));
    if (createHash('sha256').update(bytes).digest('hex') !== hash)
      throw new Error(`${entry.file} does not match its name`);
    const file = `${hash}${path.extname(entry.file)}`;
    await copyFile(path.join(root, entry.file), path.join(outDir, file));
    index[hash] = { file, mime: entry.mime, usedBy };
  }
  await writeFile(path.join(outDir, 'assets.json'), JSON.stringify(index, null, 2) + '\n');
  return index;
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
  const zip = async (name, dir, note) => {
    const file = path.join(out, name);
    await rm(file, { force: true });
    zipDirectory(dir, file);
    report.push([file, note]);
  };
  if (what === 'all' || what === 'engine') {
    const m = await stageEngine(path.join(stage, 'engine'));
    await zip(
      `atlas-engine-${m.version}.zip`,
      path.join(stage, 'engine'),
      `${Object.keys(m.files).length} files`
    );
  }
  if (what === 'all' || what === 'datapacks' || what === 'datapack') {
    const ids = what === 'datapack' ? [words[1]] : await readdir(path.join(ROOT, 'bundles'));
    for (const id of ids) {
      if (!id || !(await stat(path.join(ROOT, 'bundles', id)).catch(() => null)))
        throw new Error(`No such bundle: ${id}`);
      const m = await stageDatapack(id, path.join(stage, id));
      await zip(
        `${id}-datapack-${m.version}.zip`,
        path.join(stage, id),
        `${Object.keys(m.files).length} files`
      );
    }
  }
  if (what === 'all' || what === 'assets') {
    const index = await stageAssets(path.join(stage, 'assets'));
    await zip(
      'atlas-assets.zip',
      path.join(stage, 'assets'),
      `${Object.keys(index).length} images`
    );
  }
  await rm(stage, { recursive: true, force: true });
  for (const [file, note] of report)
    console.log(
      `${path.relative(ROOT, file)}  ${((await stat(file)).size / 1024).toFixed(0)} KB  (${note})`
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
