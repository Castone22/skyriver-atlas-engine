#!/usr/bin/env node
// Integrate the verified standalone IULR v9 runtime without mixing renderer logic into data.
// Usage: node tools/update-iulr-v9.cjs /path/to/IULR-Stellar-Atlas\(2\).html
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const { parse } = require('@babel/parser');
const root = path.resolve(__dirname, '..'),
  input = process.argv[2];
if (!input) throw Error('Supply the standalone IULR v9 HTML path');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8'),
  json = (p) => JSON.parse(read(p)),
  write = (p, s) => fs.writeFileSync(path.join(root, p), s),
  save = (p, v) => write(p, JSON.stringify(v, null, 2) + '\n'),
  hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const original = fs.readFileSync(input, 'utf8');
assert.equal(
  hash(original),
  '086360afcea27c85f78d07bc07d3138c85ef90909daad20893db0560b315ccd6',
  'Expected the reviewed standalone v9 source'
);
const scripts = [...original.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
let code = scripts.find((s) => s.includes('const DATA = '));
if (!code) throw Error('No IULR runtime');
const def = json('bundles/iulr/atlas.json'),
  assets = json('assets/manifest.json');
const ast = parse(code),
  body = (ast.program || ast).body;
const decl = body
  .flatMap((n) => (n.type === 'VariableDeclaration' ? n.declarations : []))
  .find((n) => n.id.name === 'DATA');
const sourceData = JSON.parse(code.slice(decl.init.start, decl.init.end));
const hydrated = JSON.parse(
  JSON.stringify(def.data).replace(/atlas-asset:([a-f0-9]{64})/g, (_, id) => {
    const a = assets[id];
    return (
      'data:' + a.mime + ';base64,' + fs.readFileSync(path.join(root, a.file)).toString('base64')
    );
  })
);
hydrated.edition = sourceData.edition;
assert.equal(
  hash(JSON.stringify(hydrated)),
  hash(JSON.stringify(sourceData)),
  'v9 must preserve the complete IULR catalogue apart from its edition'
);
def.data.edition = sourceData.edition;
const existing = new Map();
for (const file of fs.readdirSync(path.join(root, 'engine/functions'))) {
  if (file.endsWith('.js'))
    existing.set(read('engine/functions/' + file).trimEnd(), file.slice(0, -3));
}
const edits = [{ start: decl.init.start, end: decl.init.end, text: '__ATLAS__.data' }],
  added = [],
  reused = [];
for (const node of body) {
  if (node.type !== 'FunctionDeclaration') continue;
  const source = code.slice(node.start, node.end),
    name = node.id.name;
  let key;
  if (name === 'buildNotes') {
    const el = { innerHTML: '' },
      esc = (s) =>
        String(s).replace(
          /[&<>"']/g,
          (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
        );
    const link = (n, label = n, cls = '') =>
      `<a class="${cls}" href="https://skyrivercodex.lzridgecodes.net/index.php?title=${encodeURIComponent(n.replaceAll(' ', '_'))}" target="_blank" rel="noopener">${esc(label)}</a>`;
    vm.runInNewContext(
      source + ';buildNotes();',
      { DATA: def.data, link, $: () => el },
      { timeout: 1000 }
    );
    def.presentation = {
      ...def.presentation,
      notesHTML: el.innerHTML.replace(
        'For a move without a redirect before any visit, supply an alias/redirect or stable page ID in the register so new visitors can locate it.',
        'For a move without a redirect before any visit, keep a redirect from the original article title or update the planet’s articleTitle in the register so new visitors can locate it.'
      ),
      version: 'IULR Stellar Atlas v.9'
    };
    key = 'buildNotes-shared';
  } else {
    key = existing.get(source);
    if (key) reused.push(key);
    else {
      key = name + '-' + hash(source).slice(0, 12);
      write('engine/functions/' + key + '.js', source + '\n');
      added.push(key);
    }
  }
  edits.push({ start: node.start, end: node.end, text: `/* @atlas-function ${key} */` });
}
for (const edit of edits.sort((a, b) => b.start - a.start))
  code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
write('bundles/iulr/runtime-0.js', code);
save('bundles/iulr/atlas.json', def);
let shell = read('bundles/iulr/shell.html');
shell = shell.replace(
  /(<small id="atlasVersion">)[\s\S]*?(<\/small>)/,
  (_, a, b) => a + 'IULR Stellar Atlas v.9' + b
);
write('bundles/iulr/shell.html', shell);
const manifest = json('docs/source-manifest.json'),
  row = manifest.find((x) => x.id === 'iulr');
Object.assign(row, {
  file: path.basename(input),
  sha256: hash(original),
  sizeBytes: Buffer.byteLength(original)
});
save('docs/source-manifest.json', manifest);
const retrieved = json('docs/retrieved-sources.json');
Object.assign(
  retrieved.find((x) => x.name.startsWith('IULR-')),
  {
    name: path.basename(input),
    library_file_id: 'libfile_a90654b060348191a6ad9cd98e6150a1',
    version_id: null,
    file_id: 'file_00000000bcb881f587355390b436f076',
    modified_at: '2026-11-05T01:15:31.729214Z',
    path: '/Full-Scale HTML Maps/' + path.basename(input)
  }
);
save('docs/retrieved-sources.json', retrieved);
const profiles = Object.fromEntries(
    fs.readdirSync(path.join(root, 'bundles')).map((id) => [
      id,
      {
        scripts: json('bundles/' + id + '/bundle.json').parts.runtime.map((r) => ({
          path: 'bundles/' + id + '/' + r.path
        }))
      }
    ])
  ),
  index = {};
for (const [id, profile] of Object.entries(profiles))
  for (const script of profile.scripts)
    for (const match of read(script.path).matchAll(/\/\* @atlas-function ([\w-]+) \*\//g)) {
      const key = match[1],
        source = read('engine/functions/' + key + '.js').trimEnd();
      const entry = (index[key] ||= {
        name: key.replace(/-[^-]+$/, ''),
        profiles: [],
        bytes: Buffer.byteLength(source)
      });
      if (!entry.profiles.includes(id)) entry.profiles.push(id);
    }
save('engine/function-index.json', index);
const entries = Object.values(index);
save('docs/extraction-metrics.json', {
  profiles: Object.keys(profiles).length,
  uniqueFunctions: entries.length,
  sharedFunctions: entries.filter((f) => f.profiles.length > 1).length,
  duplicateFunctionBytesRemoved: entries.reduce((n, f) => n + (f.profiles.length - 1) * f.bytes, 0),
  assets: Object.keys(assets).length
});
save('docs/iulr-v9-migration.json', {
  sourceFile: path.basename(input),
  sourceSha256: hash(original),
  sourceLibraryFileId: 'libfile_a90654b060348191a6ad9cd98e6150a1',
  catalogueMatches: true,
  systems: def.data.systems.length,
  worlds: Object.keys(def.data.worlds).length,
  functionsAdded: added,
  functionsReused: reused.length,
  notesSeparated: true,
  version: 'IULR Stellar Atlas v.9',
  deployed: false
});
console.log(
  JSON.stringify({
    catalogueMatches: true,
    added: added.length,
    reused: reused.length,
    notesSeparated: true
  })
);
