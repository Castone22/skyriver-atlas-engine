// Turn map-specific source notes and label calibration into declarative configuration.
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url)),
  read = (p) => readFile(path.join(root, p), 'utf8'),
  write = (p, s) => writeFile(path.join(root, p), s);
const profiles = JSON.parse(await read('engine/profiles.json'));
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
for (const [id, p] of Object.entries(profiles)) {
  if (p.kind !== 'stellar') continue;
  const def = JSON.parse(await read('data/' + id + '.json'));
  for (const script of p.scripts) {
    let code = await read(script.path),
      match = code.match(/\/\* @atlas-function (buildNotes-[\w-]+) \*\//);
    if (!match || match[1] === 'buildNotes-shared') continue;
    const original = await read('engine/functions/' + match[1] + '.js'),
      el = { innerHTML: '' };
    const link = (name, label = name, cls = '') =>
      `<a class="${cls}" href="https://skyrivercodex.lzridgecodes.net/index.php?title=${encodeURIComponent(name.replaceAll(' ', '_'))}" target="_blank" rel="noopener">${esc(label)}</a>`;
    const ctx = vm.createContext({ DATA: def.data, link, $: () => el });
    vm.runInContext(original + ';buildNotes();', ctx, { timeout: 1000 });
    def.presentation = { ...def.presentation, notesHTML: el.innerHTML };
    code = code.replace(match[0], '/* @atlas-function buildNotes-shared */');
    await write(script.path, code);
  }
  await write('data/' + id + '.json', JSON.stringify(def, null, 2) + '\n');
}
await write(
  'engine/functions/buildNotes-shared.js',
  "function buildNotes(){$('notesContent').innerHTML=__ATLAS__.presentation?.notesHTML||'<p>Interactive Skyriver Codex atlas. Select a name to open its article.</p>'}\n"
);
// Give scene settings stable, meaningful names instead of source character offsets.
const rename = {
  mahanzk: {
    TEXTURE: 'texture',
    geometry: 'boundaries',
    colors: 'palette',
    contours: 'contours',
    labelAdjust: 'labelOffsets'
  },
  grand: { source: 'galaxyImage', colors: 'palette', pirateZones: 'zones' }
};
for (const [id, mapping] of Object.entries(rename)) {
  const file = 'data/' + id + '.json',
    d = JSON.parse(await read(file)),
    pairs = [];
  for (const key of Object.keys(d.constants)) {
    const name = mapping[key.replace(/_\d+$/, '')];
    if (name && key !== name) {
      d.constants[name] = d.constants[key];
      delete d.constants[key];
      pairs.push([key, name]);
    }
  }
  if (id === 'grand') {
    delete d.documents.snapshots;
    delete d.documents.searchSeed;
    d.dependencies = Object.fromEntries(
      d.documents.seed.map((e) => [e.id, e.id.replace(/-stellar-atlas$/, '')])
    );
  }
  await write(file, JSON.stringify(d, null, 2) + '\n');
  for (const script of profiles[id].scripts) {
    let code = await read(script.path);
    for (const [a, b] of pairs) code = code.split(JSON.stringify(a)).join(JSON.stringify(b));
    await write(script.path, code);
  }
  const index = JSON.parse(await read('engine/function-index.json'));
  for (const [key, entry] of Object.entries(index)) {
    if (!entry.profiles.includes(id)) continue;
    let code = await read('engine/functions/' + key + '.js');
    for (const [a, b] of pairs) code = code.split(JSON.stringify(a)).join(JSON.stringify(b));
    await write('engine/functions/' + key + '.js', code);
  }
}
// One implementation for the three stellar profiles that share a label-policy API.
const thresholds = {
  elysian: { active: [160, 220], other: [220, 320] },
  uacs: { active: [110, 150], other: [145, 190] },
  calidor: { active: [100, 155], other: [135, 195] }
};
for (const [id, overview] of Object.entries(thresholds)) {
  const file = 'data/' + id + '.json',
    d = JSON.parse(await read(file));
  d.policies = {
    ...d.policies,
    labels: { overview, regional: { active: [64, 80], other: [80, 125] } }
  };
  await write(file, JSON.stringify(d, null, 2) + '\n');
  for (const script of profiles[id].scripts) {
    let code = await read(script.path);
    code = code.replace(
      /\/\* @atlas-function labelThresholds-[\w-]+ \*\//,
      '/* @atlas-function labelThresholds-shared */'
    );
    await write(script.path, code);
  }
}
await write(
  'engine/functions/labelThresholds-shared.js',
  `function labelThresholds(){
 const box=$('map').getBoundingClientRect(),factor=Math.max(1,640/Math.max(1,box.width),360/Math.max(1,box.height));
 const policy=__ATLAS__.features?.labels||__ATLAS__.policies.labels;
 const base=policy[overviewMode?'overview':'regional'];
 return Object.fromEntries(Object.entries(base).map(([key,pair])=>[key,pair.map(v=>Math.ceil(v*factor))]));
}\n`
);
{
  const file = 'engine/profiles/mahanzk/runtime-0.js';
  let code = await read(file);
  code = code.replace(
    "wiki=n=>'https://skyrivercodex.lzridgecodes.net/index.php?title='+encodeURIComponent(n.replaceAll(' ','_'))",
    "wiki=n=>'https://skyrivercodex.lzridgecodes.net/index.php?title='+encodeURIComponent((places.find(p=>p.name===n)?.articleTitle||n).replaceAll(' ','_'))"
  );
  await write(file, code);
}
