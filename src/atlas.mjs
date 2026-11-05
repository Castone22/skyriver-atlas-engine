/** Atlas DSL. Definitions are plain, versioned JSON; no renderer code or callbacks are stored. */
export const SCHEMA_VERSION = 1;
export const CODEX = 'https://skyrivercodex.lzridgecodes.net/';
export const FEATURES = Object.freeze({
  stellar: [
    'navigation',
    'regions',
    'orbits',
    'satellites',
    'stations',
    'exotics',
    'silent',
    'articles',
    'embeds'
  ],
  geographic: ['globe', 'surface', 'terrain', 'places', 'articles'],
  galaxy: ['discovery', 'search', 'snapshots', 'sourcePriority', 'articles']
});
const plain = (x) =>
  x !== null &&
  typeof x === 'object' &&
  (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
export function assertJSON(value, path = '$', seen = new Set()) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || (!Array.isArray(value) && !plain(value)))
    throw new TypeError(`${path}: expected finite, plain JSON data`);
  if (seen.has(value)) throw new TypeError(`${path}: circular data`);
  seen.add(value);
  for (const [key, v] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key))
      throw new TypeError(`${path}.${key}: reserved key`);
    assertJSON(v, `${path}.${key}`, seen);
  }
  seen.delete(value);
}
export function clone(value) {
  assertJSON(value);
  return JSON.parse(JSON.stringify(value));
}
export function articleURL(title, { pageid, section, base = CODEX } = {}) {
  const url = new URL('index.php', base);
  if (Number.isSafeInteger(pageid) && pageid > 0) url.searchParams.set('curid', pageid);
  else url.searchParams.set('title', String(title).replaceAll(' ', '_'));
  if (section) url.hash = section;
  return url.href;
}
function text(value, field) {
  if (typeof value !== 'string' || !value.trim())
    throw new TypeError(`${field} must be a nonempty string`);
  return value;
}
function identity(value) {
  text(value, 'id');
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(value))
    throw new TypeError('id must contain letters, numbers, underscores or hyphens');
  return value;
}
export function validate(definition, { strict = true } = {}) {
  assertJSON(definition);
  const errors = [],
    warnings = [],
    d = definition.data || {};
  const issue = (message, compat = false) => (compat && !strict ? warnings : errors).push(message);
  if (definition.schemaVersion !== SCHEMA_VERSION)
    issue(`Unsupported schemaVersion: ${definition.schemaVersion}`);
  try {
    identity(definition.id);
  } catch (e) {
    issue(e.message);
  }
  if (!FEATURES[definition.kind]) issue(`Unknown atlas kind: ${definition.kind}`);
  if (typeof definition.renderer !== 'string') issue('renderer is required');
  if (definition.kind === 'stellar') {
    if (!Array.isArray(d.systems) || !plain(d.regions) || !plain(d.worlds))
      issue('stellar data requires systems[], regions{}, worlds{}');
    const systems = [...(d.systems || []), ...(d.unplaced || [])],
      ids = new Set(),
      owners = new Map();
    const knownBodies = new Set([
      ...Object.keys(d.worlds || {}),
      ...[...(d.stations || []), ...(d.satellites || []), ...(d.entities || [])].map((x) => x.name)
    ]);
    for (const s of systems) {
      if (!s.id || ids.has(s.id)) issue(`Duplicate or absent system id: ${s.id}`);
      ids.add(s.id);
      if (s.region && !Object.hasOwn(d.regions || {}, s.region))
        issue(`${s.id}: unknown region ${s.region}`, true);
      if (s.region && (!Number.isFinite(s.x) || !Number.isFinite(s.y)))
        issue(`${s.id}: finite x and y are required`);
      for (const name of s.worlds || []) {
        if (!knownBodies.has(name)) issue(`${s.id}: missing planet record ${name}`, true);
        if (owners.has(name) && owners.get(name) !== s.id)
          issue(`${name}: assigned to two systems`, true);
        owners.set(name, s.id);
      }
    }
    for (const [kind, list] of [
      ['moon', d.satellites || []],
      ['station', d.stations || []],
      ['entity', d.entities || []]
    ]) {
      const seen = new Set();
      for (const r of list) {
        const key = [r.system, r.name].join('/');
        if (seen.has(key)) issue(`Duplicate ${kind}: ${key}`, true);
        seen.add(key);
        if (r.system && !ids.has(r.system)) issue(`${r.name}: unknown system ${r.system}`, true);
        if (
          r.parent &&
          !knownBodies.has(r.parent) &&
          !systems.some((s) => (s.primaries || []).includes(r.parent))
        )
          issue(`${r.name}: unknown parent ${r.parent}`, true);
      }
    }
    if (
      d.atlasExtent &&
      (!Array.isArray(d.atlasExtent) ||
        d.atlasExtent.length !== 4 ||
        !d.atlasExtent.every(Number.isFinite) ||
        d.atlasExtent[2] <= 0 ||
        d.atlasExtent[3] <= 0)
    )
      issue('atlasExtent must be [x,y,positiveWidth,positiveHeight]');
    for (const [id, r] of Object.entries(d.regions || {})) {
      if (
        r.outline &&
        (!Array.isArray(r.outline) ||
          r.outline.length < 3 ||
          r.outline.some((p) => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)))
      )
        issue(`${id}: outline needs at least three finite [x,y] points`);
    }
  }
  if (definition.kind === 'geographic') {
    const seen = new Set();
    for (const p of d.places || []) {
      if (seen.has(p.id)) issue(`Duplicate place id: ${p.id}`);
      seen.add(p.id);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
        issue(`${p.name}: finite coordinates required`);
    }
  }
  return { valid: !errors.length, errors, warnings };
}
class SystemBuilder {
  constructor(atlas, record) {
    this.atlas = atlas;
    this.record = record;
  }
  planet(name, props = {}, children) {
    this.atlas.planet(name, props);
    if (!this.record.worlds.includes(name)) this.record.worlds.push(name);
    children?.(new PlanetBuilder(this.atlas, this.record.id, name));
    return this;
  }
  station(name, props = {}) {
    this.atlas.station(name, { ...props, system: this.record.id });
    return this;
  }
  entity(name, props = {}) {
    this.atlas.entity(name, { ...props, system: this.record.id });
    return this;
  }
}
class PlanetBuilder {
  constructor(atlas, system, name) {
    Object.assign(this, { atlas, system, name });
  }
  moon(name, props = {}) {
    this.atlas.moon(name, { ...props, system: this.system, parent: this.name });
    return this;
  }
  station(name, props = {}) {
    this.atlas.station(name, { ...props, system: this.system, parent: this.name });
    return this;
  }
}
class RegionBuilder {
  constructor(atlas, id) {
    Object.assign(this, { atlas, id });
  }
  system(id, props = {}, children) {
    this.atlas.system(id, { ...props, region: this.id }, children);
    return this;
  }
}
class AtlasBuilder {
  constructor(definition, fresh = false) {
    this.definition = clone(definition);
    this.fresh = fresh;
  }
  meta(props) {
    Object.assign(this.definition.meta, clone(props));
    return this;
  }
  presentation(props) {
    this.definition.presentation = { ...this.definition.presentation, ...clone(props) };
    return this;
  }
  feature(name, options = true) {
    text(name, 'feature');
    this.definition.features ||= {};
    this.definition.features[name] = clone(options);
    return this;
  }
  extent(x, y, width, height) {
    this.definition.data.atlasExtent = [x, y, width, height];
    return this;
  }
  region(id, props = {}, children) {
    text(id, 'region id');
    const d = this.definition.data;
    d.regions ||= {};
    if (Object.hasOwn(d.regions, id)) throw new Error(`Duplicate region: ${id}`);
    d.regions[id] = { name: id, subtitle: '', description: '', ...clone(props) };
    children?.(new RegionBuilder(this, id));
    return this;
  }
  system(id, props = {}, children) {
    text(id, 'system id');
    const d = this.definition.data;
    d.systems ||= [];
    if (d.systems.some((s) => s.id === id)) throw new Error(`Duplicate system: ${id}`);
    const r = {
      source: this.definition.meta.article,
      name: id,
      kind: 'federation',
      worlds: [],
      notes: [],
      description: '',
      major: false,
      ...clone(props),
      id
    };
    d.systems.push(r);
    children?.(new SystemBuilder(this, r));
    return this;
  }
  planet(name, props = {}) {
    text(name, 'planet catalogue name');
    const d = this.definition.data;
    d.worlds ||= {};
    if (Object.hasOwn(d.worlds, name)) throw new Error(`Duplicate planet: ${name}`);
    d.worlds[name] = {
      source: this.definition.meta.article,
      description: '',
      links: [],
      articleTitle: name,
      bodyType: 'World',
      ...clone(props)
    };
    return this;
  }
  _record(field, name, props) {
    text(name, field + ' name');
    const d = this.definition.data;
    d[field] ||= [];
    if (d[field].some((x) => x.name === name && x.system === props.system))
      throw new Error(`Duplicate ${field}: ${name}`);
    d[field].push({
      source: this.definition.meta.article,
      description: '',
      links: [],
      articleTitle: name,
      ...clone(props),
      name
    });
    return this;
  }
  moon(name, props = {}) {
    return this._record('satellites', name, { bodyType: 'Moon', ...props });
  }
  station(name, props = {}) {
    return this._record('stations', name, props);
  }
  entity(name, props = {}) {
    return this._record('entities', name, props);
  }
  place(id, props = {}) {
    const d = this.definition.data;
    d.places ||= [];
    if (d.places.some((p) => (p.key ?? p.id) === id)) throw new Error(`Duplicate place: ${id}`);
    d.places.push({
      kind: 'City',
      w: 100,
      h: 40,
      articleTitle: props.name || String(id),
      ...clone(props),
      name: props.name || String(id),
      key: id,
      id: d.places.length
    });
    return this;
  }
  texture(value) {
    this.definition.constants.texture = text(value, 'texture');
    return this;
  }
  terrain(props) {
    return this.constants(props);
  }
  background(value) {
    this.definition.constants.galaxyImage = text(value, 'background');
    return this;
  }
  zone(props) {
    this.definition.constants.zones ||= [];
    this.definition.constants.zones.push(clone(props));
    return this;
  }
  empire(id, props = {}) {
    this.definition.documents.seed ||= [];
    if (this.definition.documents.seed.some((e) => e.id === id))
      throw new Error(`Duplicate empire: ${id}`);
    this.definition.documents.seed.push({ ...clone(props), id });
    return this;
  }
  asset(name, value) {
    this.definition.data.assets ||= {};
    this.definition.data.assets[text(name, 'asset name')] = text(value, 'asset');
    return this;
  }
  constants(props) {
    Object.assign(this.definition.constants, clone(props));
    return this;
  }
  catalogue(props) {
    Object.assign(this.definition.data, clone(props));
    return this;
  }
  update(collection, id, patch) {
    const group = this.definition.data[collection],
      value = Array.isArray(group)
        ? group.find((x) => x.id === id || x.name === id || x.key === id)
        : group?.[id];
    if (!value) throw new Error(`Unknown ${collection}: ${id}`);
    Object.assign(value, clone(patch));
    return this;
  }
  build(options = {}) {
    const result = this.toJSON();
    if (this.fresh && result.kind === 'stellar') normalizeGeometry(result.data);
    const report = validate(result, options);
    if (!report.valid) throw new Error(report.errors.join('\n'));
    return result;
  }
  toJSON() {
    return clone(this.definition);
  }
}
function normalizeGeometry(d) {
  for (const [id, r] of Object.entries(d.regions)) {
    const points = d.systems.filter(
      (s) => s.region === id && Number.isFinite(s.x) && Number.isFinite(s.y)
    );
    if (!r.bounds) {
      const xs = points.map((s) => s.x),
        ys = points.map((s) => s.y);
      const x = points.length ? Math.min(...xs) - 180 : 0,
        y = points.length ? Math.min(...ys) - 180 : 0;
      r.bounds = [
        x,
        y,
        points.length ? Math.max(360, Math.max(...xs) - x + 180) : 1000,
        points.length ? Math.max(360, Math.max(...ys) - y + 180) : 1000
      ];
    }
    const [x, y, w, h] = r.bounds;
    r.labelAnchor ||= [x + w / 2, y + h / 2];
    r.labelPosition ||= r.labelAnchor;
    r.color ||= '#78cfdf';
    const c = Math.min(w, h) * 0.15;
    r.outline ||= [
      [x + c, y],
      [x + w - c, y],
      [x + w, y + c],
      [x + w, y + h - c],
      [x + w - c, y + h],
      [x + c, y + h],
      [x, y + h - c],
      [x, y + c]
    ];
  }
  if (!d.atlasExtent) {
    const b = Object.values(d.regions).map((r) => r.bounds);
    if (b.length) {
      const x = Math.min(...b.map((r) => r[0])) - 80,
        y = Math.min(...b.map((r) => r[1])) - 80;
      d.atlasExtent = [
        x,
        y,
        Math.max(...b.map((r) => r[0] + r[2])) - x + 80,
        Math.max(...b.map((r) => r[1] + r[3])) - y + 80
      ];
    } else d.atlasExtent = [0, 0, 1000, 1000];
  }
}
function create(kind, options = {}) {
  const {
    id,
    renderer = kind === 'stellar' ? 'elysian' : kind === 'geographic' ? 'mahanzk' : 'grand',
    title = id,
    article = title,
    ...meta
  } = options;
  identity(id);
  const data =
    kind === 'stellar'
      ? {
          systems: [],
          regions: {},
          worlds: {},
          satellites: [],
          stations: [],
          entities: [],
          unplaced: [],
          assets: {},
          objectImages: {}
        }
      : kind === 'geographic'
        ? { places: [] }
        : {};
  return new AtlasBuilder(
    {
      schemaVersion: 1,
      id,
      kind,
      renderer,
      meta: { title, article, ...clone(meta) },
      data,
      constants: {},
      documents: {},
      features: {}
    },
    true
  );
}
export const Atlas = Object.freeze({
  stellar: (options) => create('stellar', options),
  geographic: (options) => create('geographic', options),
  galaxy: (options) => create('galaxy', options),
  fromJSON: (input) => new AtlasBuilder(typeof input === 'string' ? JSON.parse(input) : input)
});
