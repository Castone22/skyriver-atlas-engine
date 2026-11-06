import { clone, validate } from './atlas.mjs';
import { render, safeJSON, escapeHTML as escape } from './template.mjs';
import { satisfies } from './bundle.mjs';
/**
 * Pure compiler core: bundles in, HTML out. It imports nothing from Node, so it can run in a
 * browser. Everything environmental comes from `host`:
 *
 *   host.engine()          Promise<Bundle>        the opened engine bundle
 *   host.atlas(id)         Promise<Bundle|null>   an opened atlas bundle, or null if none
 *   host.asset(sha256)     Promise<string>        URL or data: URL for an asset; throws if missing
 *   host.gzipBase64(text)  Promise<string>        gzip then base64; needed only for Grand snapshots
 *   host.loadSearch(code)  Promise<{indexData}>   optional; precomputes Grand's search seed
 */
const replace = (s, a, b) => s.split(a).join(b);
/**
 * Everything the compiler needs from a bundle, as plain data plus text readers. A shell, style or
 * runtime the atlas bundle does not supply comes from the engine's defaults for the atlas's kind
 * (`defaults` in the engine's bundle.json), part by part.
 */
function profileOf(bundle, engine) {
  const m = bundle.manifest,
    own = m.parts ?? {},
    fallback = engine.manifest.defaults?.[m.kind];
  const part = (name, supplied) => {
    if (supplied !== undefined) return { from: bundle, path: supplied };
    const path = fallback?.parts?.[name];
    if (path === undefined)
      throw new Error(
        `Bundle '${m.id}' has no ${name}, and engine ${engine.manifest.id ?? ''} ${engine.manifest.version} has no default ${name} for ${m.kind} atlases`
      );
    return { from: engine, path };
  };
  const list = (name, supplied) =>
    supplied !== undefined
      ? supplied.map((x) => ({ from: bundle, path: x.path ?? x }))
      : [].concat(part(name, undefined).path).map((path) => ({ from: engine, path }));
  const scripts = list('runtime', own.runtime);
  return {
    id: m.id,
    kind: m.kind,
    brand: m.brand,
    capabilities: m.capabilities,
    bundle,
    atlas: m.atlas ?? 'atlas.json',
    shell: part('shell', own.shell),
    styles: list('styles', own.styles),
    scripts,
    slots: fallback?.slots ?? {}
  };
}
async function linkRuntime(source, slots, host) {
  const chunks = [...source.matchAll(/\/\* @atlas-function ([\w-]+) \*\//g)];
  const contents = await Promise.all(
    chunks.map(async (m) => {
      const file = 'functions/' + m[1] + '.js';
      return render(await (await host.engine()).text(file), slots, 'engine/' + file);
    })
  );
  for (let i = chunks.length - 1; i >= 0; i--)
    source =
      source.slice(0, chunks[i].index) +
      contents[i] +
      source.slice(chunks[i].index + chunks[i][0].length);
  return source;
}
async function resolveAssets(definition, host) {
  const urls = new Map();
  async function asset(id) {
    if (!urls.has(id)) urls.set(id, await host.asset(id));
    return urls.get(id);
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
/**
 * Capability flags. The engine's flags.json lists every flag with a description and a default;
 * the renderer bundle's `flags` set them for its atlases and a definition may override. Shared
 * functions read them as `__ATLAS__.flags.name`. A name that is not in the registry is an error,
 * so a typo cannot silently disable a feature.
 */
async function resolveFlags(definition, base, host) {
  const engine = await host.engine();
  const registry = engine.has('flags.json') ? await engine.json('flags.json') : {};
  const flags = {};
  for (const [name, spec] of Object.entries(registry)) flags[name] = spec.default;
  for (const [where, source] of [
    [`bundle '${base.manifest.id}'`, base.manifest.flags],
    ['the definition', definition.flags]
  ])
    for (const [name, value] of Object.entries(source ?? {})) {
      if (!Object.hasOwn(registry, name))
        throw new Error(`Unknown flag '${name}' in ${where}; add it to engine/flags.json`);
      flags[name] = value;
    }
  return flags;
}
/** Link shared source functions and profile adapters; emit a portable, self-contained artifact. */
export async function compileCore(definition, host, { strict = false, dependencies = {} } = {}) {
  const report = validate(definition, { strict });
  if (!report.valid) throw new Error(report.errors.join('\n'));
  const base = await host.atlas(definition.renderer),
    profile = base && profileOf(base, await host.engine());
  featureChecks(definition, profile);
  if (!profile || profile.kind !== definition.kind)
    throw new Error(`Invalid ${definition.kind} renderer: ${definition.renderer}`);
  let d = clone(definition);
  const engineVersion = (await host.engine()).manifest.version,
    range = base.manifest.engine;
  if (!satisfies(engineVersion, range))
    throw new Error(
      `Bundle '${profile.id}' needs engine ${range}; this is engine ${engineVersion}`
    );
  const engineKinds = (await host.engine()).manifest.kinds;
  if (!engineKinds.includes(profile.kind))
    throw new Error(
      `Engine ${(await host.engine()).manifest.id ?? ''} ${engineVersion} does not support ${profile.kind} atlases (it supports ${engineKinds.join(', ')})`
    );
  // The renderer bundle's own atlas.json supplies defaults. All inherited values become explicit
  // in exported JSON.
  const defaults = await base.json(profile.atlas);
  if (defaults?.policies) d.policies = { ...defaults.policies, ...d.policies };
  if (d.kind === 'stellar') d.flags = await resolveFlags(definition, base, host);
  // Geographic/galaxy profiles provide default scene assets.
  if (d.kind !== 'stellar') d.constants = { ...defaults?.constants, ...d.constants };
  if (d.kind === 'galaxy') {
    d.documents = { ...defaults?.documents, ...d.documents };
    const seed = d.documents.seed || [],
      snapshots = { ...d.documents.snapshots },
      search = { ...d.documents.searchSeed };
    if (seed.length && !host.gzipBase64)
      throw new Error('This host cannot gzip child snapshots, which a galaxy atlas needs');
    const searchModule = host.loadSearch
      ? await host.loadSearch(await linkRuntime(await profile.scripts[0].from.text(profile.scripts[0].path), {}, host))
      : null;
    for (const entry of seed) {
      let child = dependencies[entry.id] || dependencies[entry.id.replace(/-stellar-atlas$/, '')];
      if (!child) {
        const key = d.dependencies?.[entry.id] || entry.map;
        if (!key || !/^[a-z0-9][a-z0-9_-]*$/i.test(key))
          throw new Error(`Missing child atlas dependency: ${entry.id}`);
        const childBundle = await host.atlas(key);
        if (!childBundle) throw new Error(`Missing child atlas dependency: ${entry.id}`);
        const childDef = await childBundle.json(childBundle.manifest.atlas ?? 'atlas.json');
        if (childDef.kind !== 'stellar')
          throw new Error('Galaxy dependencies must be stellar atlases');
        child = await compileCore(childDef, host);
      }
      snapshots[entry.id] = await host.gzipBase64(child.html);
      if (searchModule) search[entry.id] = searchModule.indexData(child.definition.data);
    }
    d.documents.snapshots = snapshots;
    d.documents.searchSeed = search;
    // Keep the original affiliation baseline. Replacing it would hide real transfers.
  }
  const hydrated = await resolveAssets(d, host);
  d = hydrated.definition;
  const customBrand = d.meta.article !== profile.brand;
  // Template values for shells, runtime scripts and functions: the brand, plus the bundle's own
  // `slots` (per-atlas text such as file names). A bundle slot may use {{brand}} itself.
  const brand = customBrand ? d.meta.article : profile.brand;
  const slots = { brand };
  for (const [name, value] of Object.entries({ ...profile.slots, ...base.manifest.slots })) {
    if (typeof value !== 'string')
      throw new Error(`Bundle '${profile.id}': slot '${name}' must be a string`);
    if (name !== 'brand') slots[name] = replace(value, '{{brand}}', brand);
  }
  let html = render(
    await profile.shell.from.text(profile.shell.path),
    slots,
    profile.id + '/' + profile.shell.path
  );
  for (let i = 0; i < profile.styles.length; i++)
    html = replace(html, `@@STYLE:${i}@@`, await profile.styles[i].from.text(profile.styles[i].path));
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
    const script = profile.scripts[i],
      scriptPath = script.path;
    let code = await linkRuntime(
      render(await script.from.text(scriptPath), slots, profile.id + '/' + scriptPath),
      slots,
      host
    );
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
      const original = await script.from.text(scriptPath),
        marker = original.match(/\/\* @atlas-function (buildNotes(?:-[\w-]+)?) \*\//);
      if (marker)
        code = replace(
          code,
          await (await host.engine()).text('functions/' + marker[1] + '.js'),
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
