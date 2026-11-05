#!/usr/bin/env node
import { readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url)),
  file = process.argv[2];
if (!file) throw new Error('Usage: node tools/asset.mjs path/to/image.png');
const ext = path.extname(file).toLowerCase(),
  mime = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  }[ext];
if (!mime) throw new Error('Supported assets: PNG, JPEG, WebP, SVG');
const bytes = await readFile(file),
  id = createHash('sha256').update(bytes).digest('hex'),
  target = 'assets/' + id + ext;
const manifestFile = path.join(root, 'assets/manifest.json'),
  manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
await writeFile(path.join(root, target), bytes);
manifest[id] = { file: target, mime };
const temp = manifestFile + '.tmp';
await writeFile(temp, JSON.stringify(manifest, null, 2) + '\n');
await rename(temp, manifestFile);
console.log('atlas-asset:' + id);
