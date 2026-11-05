#!/usr/bin/env node
// One-time migration tool. Runtime/build have no third-party dependencies.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  vm = require('node:vm');
const { parse } = require('@babel/parser');
const root = path.resolve(__dirname, '..'),
  source = path.resolve(process.argv[2] || '../sources/Full-Scale HTML Maps');
const names = {
  kadaym: 'Kadaym-Stellar-Atlas(3).html',
  elysian: 'Elysian-Stellar-Atlas.html',
  uacs: 'UACS-Stellar-Atlas.html',
  iulr: 'IULR-Stellar-Atlas(2).html',
  calidor: 'Calidor-Stellar-Atlas.html',
  grand: 'Grand-Atlas.html',
  mahanzk: 'Mahanzk-Geographic-Atlas.html'
};
const brands = {
  kadaym: 'United Federation of Kadaym',
  elysian: 'Elysian Collective',
  uacs: 'United Alliance of Commonwealth States',
  iulr: 'Interstellar Union of Liberated Republics',
  calidor: 'Dominion of Calidor',
  grand: 'Grand Atlas',
  mahanzk: 'Mahanzk'
};
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const write = (p, s) => {
  p = path.join(root, p);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};
const json = (p, o) => write(p, JSON.stringify(o, null, 2) + '\n');
const functions = new Map(),
  assetMap = {},
  profiles = {},
  provenance = [];
function externalAssets(text) {
  return text.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, (url) => {
    const [, mime, b64] = url.match(/^data:([^;]+);base64,(.+)$/),
      b = Buffer.from(b64, 'base64'),
      id = hash(b),
      ext =
        { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg' }[
          mime
        ] || 'bin';
    write('assets/' + id + '.' + ext, b);
    assetMap[id] = { file: 'assets/' + id + '.' + ext, mime };
    return 'atlas-asset:' + id;
  });
}
function pure(n) {
  if (!n) return false;
  if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral', 'NullLiteral'].includes(n.type))
    return true;
  if (n.type === 'UnaryExpression' && ['-', '+'].includes(n.operator)) return pure(n.argument);
  if (n.type === 'ArrayExpression') return n.elements.every((x) => x && pure(x));
  if (n.type === 'ObjectExpression')
    return n.properties.every(
      (x) =>
        x.type === 'ObjectProperty' &&
        !x.computed &&
        (x.key.type === 'Identifier' || pure(x.key)) &&
        pure(x.value)
    );
  return false;
}
function walk(n, fn) {
  if (!n || typeof n !== 'object') return;
  fn(n);
  for (const [k, v] of Object.entries(n))
    if (!['loc', 'start', 'end', 'extra', 'tokens', 'comments'].includes(k)) {
      if (Array.isArray(v)) v.forEach((x) => walk(x, fn));
      else if (v && typeof v === 'object') walk(v, fn);
    }
}
for (const [id, file] of Object.entries(names)) {
  const original = fs.readFileSync(path.join(source, file), 'utf8'),
    scripts = [],
    payload = {
      schemaVersion: 1,
      id,
      kind: id === 'grand' ? 'galaxy' : id === 'mahanzk' ? 'geographic' : 'stellar',
      renderer: id,
      meta: {
        title:
          id === 'grand'
            ? 'Grand Atlas'
            : id === 'mahanzk'
              ? 'Mahanzk Geographic Atlas'
              : brands[id] + ' · Stellar Atlas',
        article: brands[id]
      },
      data: {},
      constants: {},
      documents: {}
    };
  let html = externalAssets(original),
    part = 0;
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs, code) => {
    if (/sites-widget|__CF\$cv\$|challenge-platform/.test(code)) return '';
    const ident = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (/application\/json/.test(attrs)) {
      payload.documents[ident] = JSON.parse(code);
      return `<script${attrs}>@@DOCUMENT:${ident}@@</script>`;
    }
    if (!code.trim()) return whole;
    let ast = parse(code),
      edits = [];
    // Pure catalogue and geometry constants become serializable map data.
    walk(ast.program || ast, (n) => {
      if (n.type !== 'VariableDeclarator' || n.id.type !== 'Identifier' || !n.init) return;
      const key = n.id.name;
      if (key === 'DATA') {
        payload.data = JSON.parse(code.slice(n.init.start, n.init.end));
        edits.push({ start: n.init.start, end: n.init.end, value: '__ATLAS__.data' });
        return;
      }
      if (id === 'mahanzk' && key === 'places') {
        payload.data.places = vm.runInNewContext(
          code.slice(n.init.start, n.init.end),
          {},
          { timeout: 1000 }
        );
        edits.push({ start: n.init.start, end: n.init.end, value: '__ATLAS__.data.places' });
        return;
      }
      if (id === 'grand' || id === 'mahanzk') {
        if (
          pure(n.init) &&
          ((['geometry', 'colors', 'contours', 'labelAdjust', 'pirateZones'].includes(key) &&
            (n.init.type === 'ObjectExpression' || n.init.type === 'ArrayExpression')) ||
            (n.init.type === 'StringLiteral' && n.init.value.startsWith('atlas-asset:')))
        ) {
          const slot = key + '_' + n.start;
          payload.constants[slot] = vm.runInNewContext(
            '(' + code.slice(n.init.start, n.init.end) + ')',
            {},
            { timeout: 1000 }
          );
          edits.push({
            start: n.init.start,
            end: n.init.end,
            value: `__ATLAS__.constants[${JSON.stringify(slot)}]`
          });
        }
      }
    });
    // Only replace disjoint AST initializers (DATA traversal has no declarators).
    for (const e of edits.sort((a, b) => b.start - a.start))
      code = code.slice(0, e.start) + e.value + code.slice(e.end);
    ast = parse(code);
    edits = [];
    for (const n of (ast.program || ast).body) {
      if (n.type === 'FunctionDeclaration' && n.id) {
        const body = code.slice(n.start, n.end),
          key = n.id.name + '-' + hash(body).slice(0, 12),
          entry = functions.get(key) || { name: n.id.name, body, profiles: [] };
        entry.profiles.push(id);
        functions.set(key, entry);
        edits.push({ start: n.start, end: n.end, value: `/* @atlas-function ${key} */` });
      }
    }
    for (const e of edits.reverse()) code = code.slice(0, e.start) + e.value + code.slice(e.end);
    const runtime = `engine/profiles/${id}/runtime-${part}.js`;
    write(runtime, code);
    scripts.push({ path: runtime, attrs });
    return `<script${attrs}>@@RUNTIME:${part++}@@</script>`;
  });
  // Strip hydrated map DOM: these containers are recreated by their renderer.
  if (payload.kind === 'stellar') {
    html = html.replace(
      /(<svg\b[^>]*\bid="map"[^>]*>)([\s\S]*?)(<\/svg>)/i,
      (_, a, content, b) =>
        a + (content.match(/<defs>[\s\S]*?<\/defs>/)?.[0] || '') + '<g id="scene"></g>' + b
    );
  }
  const styles = [];
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs, css) => {
    const p = `engine/profiles/${id}/style-${styles.length}.css`;
    write(p, css);
    styles.push(p);
    return `<style${attrs}>@@STYLE:${styles.length - 1}@@</style>`;
  });
  write(`engine/profiles/${id}/shell.html`, html);
  profiles[id] = {
    id,
    kind: payload.kind,
    brand: brands[id],
    shell: `engine/profiles/${id}/shell.html`,
    styles,
    scripts
  };
  json(`data/${id}.json`, payload);
  write(
    `maps/${id}.atlas.mjs`,
    `import { Atlas } from '../src/atlas.mjs';\nimport definition from '../data/${id}.json' with { type: 'json' };\n\n// Edit this data through the DSL, or edit its JSON catalogue directly.\nexport default Atlas.fromJSON(definition).build();\n`
  );
  provenance.push({
    id,
    file,
    sha256: hash(original),
    sizeBytes: Buffer.byteLength(original),
    systems: payload.data.systems?.length,
    worlds: Object.keys(payload.data.worlds || {}).length,
    satellites: payload.data.satellites?.length,
    stations: payload.data.stations?.length,
    regions: Object.keys(payload.data.regions || {}).length
  });
}
for (const [key, f] of functions) write(`engine/functions/${key}.js`, f.body + '\n');
json('engine/profiles.json', profiles);
json('assets/manifest.json', assetMap);
json('docs/source-manifest.json', provenance);
json(
  'engine/function-index.json',
  Object.fromEntries(
    [...functions].map(([key, f]) => [
      key,
      { name: f.name, profiles: [...new Set(f.profiles)], bytes: Buffer.byteLength(f.body) }
    ])
  )
);
const all = [...functions.values()],
  shared = all.filter((f) => new Set(f.profiles).size > 1);
json('docs/extraction-metrics.json', {
  profiles: 7,
  uniqueFunctions: all.length,
  sharedFunctions: shared.length,
  duplicateFunctionBytesRemoved: all.reduce(
    (n, f) => n + (f.profiles.length - 1) * Buffer.byteLength(f.body),
    0
  ),
  assets: Object.keys(assetMap).length
});
console.log(
  JSON.stringify({
    profiles: 7,
    functions: all.length,
    shared: shared.length,
    assets: Object.keys(assetMap).length
  })
);
