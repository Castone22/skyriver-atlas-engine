import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { clone, validate } from './atlas.mjs';
import { render, safeJSON, escapeHTML as escape } from './template.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (p) => readFile(path.join(ROOT, p), 'utf8');
const json = (p) => read(p).then(JSON.parse);
const replace = (s, a, b) => s.split(a).join(b);
async function linkRuntime(source, slots = {}) {
  const chunks = [...source.matchAll(/\/\* @atlas-function ([\w-]+) \*\//g)];
  const contents = await Promise.all(
    chunks.map(async (m) => {
      const file = 'engine/functions/' + m[1] + '.js';
      return render(await read(file), slots, file);
    })
  );
  for (let i = chunks.length - 1; i >= 0; i--)
    source =
      source.slice(0, chunks[i].index) +
      contents[i] +
      source.slice(chunks[i].index + chunks[i][0].length);
  return source;
}
async function resolveAssets(definition) {
  const assets = await json('assets/manifest.json'),
    urls = new Map();
  async function asset(id) {
    if (urls.has(id)) return urls.get(id);
    const info = assets[id];
    if (!info) throw new Error(`Missing asset: ${id}`);
    const b = await readFile(path.join(ROOT, info.file));
    const u = `data:${info.mime};base64,${b.toString('base64')}`;
    urls.set(id, u);
    return u;
  }
  const serialized = JSON.stringify(definition);
  for (const id of new Set(
    [...serialized.matchAll(/atlas-asset:([a-f0-9]{64})/g)].map((m) => m[1])
  ))
    await asset(id);
  return {
    definition: JSON.parse(
      serialized.replace(/atlas-asset:([a-f0-9]{64})/g, (_, id) => urls.get(id))
    ),
    asset
  };
}
async function hydrateText(text, asset) {
  const matches = [...text.matchAll(/atlas-asset:([a-f0-9]{64})/g)];
  for (const id of new Set(matches.map((m) => m[1])))
    text = replace(text, 'atlas-asset:' + id, await asset(id));
  return text;
}
function featureChecks(d, profile) {
  const supported = d.kind === 'stellar' ? ['index', 'labels', 'motion'] : [];
  for (const key of Object.keys(d.features || {}))
    if (!supported.includes(key))
      throw new Error(
        `Feature configuration '${key}' is not supported by ${d.renderer}. Capabilities are inherited from the renderer; see engine/capabilities.json.`
      );
  if (d.features?.labels && profile?.capabilities?.configurableLabels === false)
    throw new Error(profile.capabilities.configurableLabelsMessage);
  if (d.features?.labels) {
    for (const mode of ['overview', 'regional'])
      for (const level of ['active', 'other']) {
        const p = d.features.labels[mode]?.[level];
        if (!Array.isArray(p) || p.length !== 2 || !p.every((x) => Number.isFinite(x) && x > 0))
          throw new Error(`labels.${mode}.${level} requires two positive percentages`);
      }
  }
}
function stellarHooks(d, profile) {
  return `\n// Shared host API: immutable exported catalogue and source-compatible navigation.\nwindow.AtlasFramework = Object.freeze({\n version:'1.0.0', id:${safeJSON(d.id)},\n exportJSON:()=>JSON.parse(JSON.stringify({...__ATLAS__,data:__ATLAS_SOURCE_DATA__,documents:{}})),\n navigate(route){\n  const address=new URL(location.href);for(const k of ['region','system','planet','object','view','chart','focus','station'])address.searchParams.delete(k);\n  for(const [k,v] of Object.entries(route))if(['region','system','planet','object','view','chart','focus','station'].includes(k)&&v!=null)address.searchParams.set(k,String(v));\n  address.hash='';history.pushState(null,'',address);restoreRoute(null,false);\n },\n articleURL(name){return url(name)},\n snapshot(){return {region:view,system:selected,planet:planetFocus,zoom:baseWidth/vb.w*100}}\n});\nif(__ATLAS__.features?.index){\n const open=__ATLAS__.features.index.collapsed===false;\n if(typeof setIndexOpen==='function')setIndexOpen(open);\n else if(document.getElementById('toggleIndexPanel')){const button=document.getElementById('toggleIndexPanel');if((button.getAttribute('aria-expanded')==='true')!==open)button.click();}\n}\nif(__ATLAS__.features?.motion?.paused===true){orbitPaused=true;stopOrbit();renderDetail();}\n${d.features?.labels ? `labelThresholds=function(active){\n const box=$('map').getBoundingClientRect(),factor=Math.max(1,640/Math.max(1,box.width),360/Math.max(1,box.height));\n const overview=typeof overviewMode!=='undefined'?overviewMode:view==='all',policy=__ATLAS__.features.labels[overview?'overview':'regional'];\n const result=Object.fromEntries(Object.entries(policy).map(([k,p])=>[k,p.map(v=>Math.ceil(v*factor))]));\n return ${profile.capabilities?.labelThresholdsByLevel ? "result[active?'active':'other']" : 'result'};\n};applyView();` : ''}\n`;
}
/** Link shared source functions and profile adapters; emit a portable, self-contained artifact. */
export async function compile(definition, { strict = false, dependencies = {} } = {}) {
  const report = validate(definition, { strict });
  if (!report.valid) throw new Error(report.errors.join('\n'));
  const profiles = await json('engine/profiles.json'),
    profile = profiles[definition.renderer];
  featureChecks(definition, profile);
  if (!profile || profile.kind !== definition.kind)
    throw new Error(`Invalid ${definition.kind} renderer: ${definition.renderer}`);
  let d = clone(definition);
  // A profile may name a defaults file. All inherited values become explicit in exported JSON.
  const defaults = profile.defaults ? await json(profile.defaults) : null;
  if (defaults?.policies) d.policies = { ...defaults.policies, ...d.policies };
  // Geographic/galaxy profiles provide default scene assets.
  if (d.kind !== 'stellar') d.constants = { ...defaults?.constants, ...d.constants };
  if (d.kind === 'galaxy') {
    d.documents = { ...defaults?.documents, ...d.documents };
    const seed = d.documents.seed || [],
      snapshots = { ...d.documents.snapshots },
      search = { ...d.documents.searchSeed };
    const runtimes = await Promise.all(profile.scripts.map((x) => read(x.path).then(linkRuntime)));
    const context = vm.createContext({});
    vm.runInContext(runtimes[0], context, { timeout: 1000 });
    for (const entry of seed) {
      let child = dependencies[entry.id] || dependencies[entry.id.replace(/-stellar-atlas$/, '')];
      if (!child) {
        const key = d.dependencies?.[entry.id] || entry.map;
        if (!key || !/^[a-z0-9][a-z0-9_-]*$/i.test(key))
          throw new Error(`Missing child atlas dependency: ${entry.id}`);
        const childDef = JSON.parse(await read('data/' + key + '.json'));
        if (childDef.kind !== 'stellar')
          throw new Error('Galaxy dependencies must be stellar atlases');
        child = await compile(childDef);
      }
      snapshots[entry.id] = gzipSync(child.html, { mtime: 0 }).toString('base64');
      search[entry.id] = context.GrandAtlasSearch.indexData(child.definition.data);
    }
    d.documents.snapshots = snapshots;
    d.documents.searchSeed = search;
    // Keep the original affiliation baseline. Replacing it would hide real transfers.
  }
  const hydrated = await resolveAssets(d);
  d = hydrated.definition;
  const customBrand = d.meta.article !== profile.brand;
  // Template values for shells and runtime entry scripts.
  const slots = { brand: customBrand ? d.meta.article : profile.brand };
  let html = render(await read(profile.shell), slots, profile.shell);
  for (let i = 0; i < profile.styles.length; i++)
    html = replace(html, `@@STYLE:${i}@@`, await read(profile.styles[i]));
  for (const [key, value] of Object.entries(d.documents))
    html = replace(html, `@@DOCUMENT:${key}@@`, safeJSON(value));
  // Fresh stellar shells use current catalogue choices rather than baked-in dropdown entries.
  if (d.kind === 'stellar')
    html = html.replace(
      /(<select\b[^>]*id="(?:regionPicker|regionSelect)"[^>]*>)[\s\S]*?(<\/select>)/,
      (_, a, b) =>
        a +
        '<option value="all">Whole atlas overview</option>' +
        Object.entries(d.data.regions)
          .map(([id, r]) => `<option value="${escape(id)}">${escape(r.name)}</option>`)
          .join('') +
        b
    );
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(d.meta.title)}</title>`);
  // Only explicitly customized definitions replace branding and optional presentation content.
  if (customBrand) html = html.replace(/<div class="stat">[\s\S]*?<\/div>/g, '');
  if (d.presentation?.version)
    html = html.replace(
      /(<small id="atlasVersion">)[\s\S]*?(<\/small>)/,
      (_, a, b) => a + escape(d.presentation.version) + b
    );
  if (d.presentation?.subtitle)
    html = html.replace(
      /(<p id="mapSubtitle">)[\s\S]*?(<\/p>)/,
      (_, a, b) => a + escape(d.presentation.subtitle) + b
    );
  for (let i = 0; i < profile.scripts.length; i++) {
    const scriptPath = profile.scripts[i].path;
    let code = await linkRuntime(render(await read(scriptPath), slots, scriptPath), slots);
    code = replace(code, '__ATLAS__.data', safeJSON(d.data));
    if (d.kind === 'stellar' && i === 0) {
      const marker = 'const DATA = ' + safeJSON(d.data) + ';';
      code = replace(
        code,
        marker,
        marker + '\nconst __ATLAS_SOURCE_DATA__=JSON.parse(JSON.stringify(DATA));'
      );
    }
    if (d.kind === 'stellar' && (customBrand || d.presentation?.notesHTML !== undefined)) {
      const notes =
        d.presentation?.notesHTML ||
        '<p>Interactive atlas. Names link to their corresponding Skyriver Codex articles. Orbital distances are schematic.</p>';
      // Replace the notes function through the AST include contract, never splice braces.
      const original = await read(profile.scripts[i].path),
        marker = original.match(/\/\* @atlas-function (buildNotes-[\w-]+) \*\//);
      if (marker)
        code = replace(
          code,
          await read('engine/functions/' + marker[1] + '.js'),
          `function buildNotes(){$('notesContent').innerHTML=${safeJSON(notes)}}\n`
        );
    }
    if (i === 0) {
      const config = { ...d };
      delete config.data;
      delete config.documents;
      code = `const __ATLAS__=${safeJSON(config)};\n` + code;
    }
    if (i === profile.scripts.length - 1 && d.kind === 'stellar') code += stellarHooks(d, profile);
    // Generated code must never terminate its enclosing script through a data string.
    code = code.replace(/<\/script/gi, '<\\/script');
    html = replace(html, `@@RUNTIME:${i}@@`, code);
  }
  html = await hydrateText(html, hydrated.asset);
  if (/@@(?:RUNTIME|STYLE|DOCUMENT):/.test(html)) throw new Error('Unresolved build placeholder');
  return { html, definition: clone(definition), warnings: report.warnings };
}
export async function writeAtlas(definition, filename, options) {
  const result = await compile(definition, options);
  await mkdir(path.dirname(path.resolve(filename)), { recursive: true });
  await writeFile(filename, result.html);
  return result;
}
