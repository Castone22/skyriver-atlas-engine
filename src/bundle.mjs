/**
 * Bundle model: a bundle is a tree of files plus a bundle.json manifest. See docs/BUNDLES.md.
 *
 * This module has no Node imports. Transports (directory, HTTP, wiki pages) live elsewhere and
 * only need to provide `{ files, read }`:
 *   files: string[]               normalized relative paths, using '/'
 *   read(path): Promise<string>   text contents of one file
 */

export const BUNDLE_VERSION = 1;
export const KINDS = ['stellar', 'geographic', 'galaxy'];
const ID = /^[a-z0-9][a-z0-9_-]*$/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const SHA256 = /^[a-f0-9]{64}$/;

/** A relative path made only of safe segments. */
export function isSafePath(p) {
  if (typeof p !== 'string' || !p || p.startsWith('/') || p.includes('\\') || p.includes('\0'))
    return false;
  return p.split('/').every((s) => s && s !== '.' && s !== '..');
}

const parse = (v) => {
  const m = SEMVER.exec(v);
  return m ? m.slice(1).map(Number) : null;
};
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** Supports `*`, an exact version, and `^x.y.z`. Throws on anything else. */
export function satisfies(version, range) {
  const v = parse(version);
  if (!v) throw new Error(`Invalid version '${version}'`);
  if (range === '*') return true;
  if (range.startsWith('^')) {
    const r = parse(range.slice(1));
    if (!r) throw new Error(`Invalid version range '${range}'`);
    const ceiling = r[0] > 0 ? [r[0] + 1, 0, 0] : r[1] > 0 ? [0, r[1] + 1, 0] : [0, 0, r[2] + 1];
    return cmp(v, r) >= 0 && cmp(v, ceiling) < 0;
  }
  const r = parse(range);
  if (!r) throw new Error(`Invalid version range '${range}'`);
  return cmp(v, r) === 0;
}

/** A read-only view of a bundle's files. */
export class Bundle {
  constructor({ files, read }) {
    this.files = [...files];
    this._set = new Set(this.files);
    this._read = read;
    this.manifest = null;
  }
  static fromMap(map) {
    const entries = map instanceof Map ? map : new Map(Object.entries(map));
    return new Bundle({ files: [...entries.keys()], read: async (p) => entries.get(p) });
  }
  has(p) {
    return this._set.has(p);
  }
  list(prefix = '') {
    return this.files.filter((f) => f.startsWith(prefix));
  }
  async text(p) {
    if (!this.has(p)) throw new Error(`Bundle file not found: ${p}`);
    return this._read(p);
  }
  async json(p) {
    try {
      return JSON.parse(await this.text(p));
    } catch (e) {
      throw new Error(`Bundle file ${p} is not valid JSON: ${e.message}`);
    }
  }
}

/** Return a list of problems with a manifest and the files it declares. Empty means valid. */
export function validateManifest(manifest, files) {
  const errors = [];
  const present = new Set(files);
  const need = (p, what) => {
    if (!isSafePath(p)) errors.push(`${what}: unsafe path '${p}'`);
    else if (!present.has(p)) errors.push(`${what}: missing file '${p}'`);
  };
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    return ['bundle.json must be an object'];
  if (manifest.bundleVersion !== BUNDLE_VERSION)
    errors.push(`Unsupported bundleVersion ${manifest.bundleVersion}; expected ${BUNDLE_VERSION}`);
  if (!['atlas', 'engine'].includes(manifest.type)) errors.push(`Unknown type '${manifest.type}'`);
  if (!parse(manifest.version)) errors.push(`version must be x.y.z, found '${manifest.version}'`);
  if (manifest.files !== undefined) {
    if (!manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files))
      errors.push('files must be an object mapping path to sha256');
    else
      for (const [p, hash] of Object.entries(manifest.files)) {
        need(p, 'files');
        if (p === 'bundle.json') errors.push("files: must not list 'bundle.json'");
        if (!SHA256.test(hash)) errors.push(`files: '${p}' needs a lowercase sha256 hex digest`);
      }
  }
  // A pack is one JSON file holding the text of every file under a prefix (path -> text), so a loader can
  // fetch them in one request. The files stay in the bundle too.
  if (manifest.pack !== undefined) {
    const pack = manifest.pack;
    if (
      !pack ||
      typeof pack.file !== 'string' ||
      typeof pack.prefix !== 'string' ||
      !pack.prefix.endsWith('/')
    )
      errors.push('pack needs a file and a prefix ending in /');
    else need(pack.file, 'pack.file');
  }
  if (manifest.type === 'engine') {
    if (!Array.isArray(manifest.kinds) || !manifest.kinds.every((k) => KINDS.includes(k)))
      errors.push('engine kinds must be a list of known kinds');
    // An engine's id tells engines apart (for example a stellar engine and a surface-map engine).
    if (manifest.id !== undefined && !ID.test(manifest.id))
      errors.push(`Invalid engine id '${manifest.id}'`);
    // Defaults: the shell, styles, runtime and slots used for an atlas of a kind that supplies none.
    for (const [kind, spec] of Object.entries(manifest.defaults ?? {})) {
      if (!KINDS.includes(kind)) errors.push(`defaults: unknown kind '${kind}'`);
      if (!manifest.kinds?.includes(kind))
        errors.push(`defaults: the engine does not support kind '${kind}'`);
      const parts = spec?.parts ?? {};
      if (parts.shell !== undefined) need(parts.shell, `defaults.${kind}.shell`);
      for (const name of ['styles', 'runtime'])
        for (const p of parts[name] ?? []) need(p, `defaults.${kind}.${name}`);
      for (const [name, value] of Object.entries(spec?.slots ?? {}))
        if (typeof value !== 'string')
          errors.push(`defaults.${kind}.slots.${name} must be a string`);
    }
  }
  if (manifest.type === 'atlas') {
    if (!ID.test(manifest.id ?? '')) errors.push(`Invalid id '${manifest.id}'`);
    if (!KINDS.includes(manifest.kind)) errors.push(`Unknown kind '${manifest.kind}'`);
    if (typeof manifest.brand !== 'string' || !manifest.brand) errors.push('brand is required');
    try {
      satisfies('1.0.0', manifest.engine ?? '');
    } catch {
      errors.push(`engine range '${manifest.engine}' is not valid`);
    }
    need(manifest.atlas ?? 'atlas.json', 'atlas');
    const parts = manifest.parts ?? {};
    if (parts.shell !== undefined) need(parts.shell, 'parts.shell');
    for (const s of parts.styles ?? []) need(s, 'parts.styles');
    for (const r of parts.runtime ?? []) {
      if (!r || typeof r.path !== 'string') errors.push('parts.runtime entries need a path');
      else need(r.path, 'parts.runtime');
    }
  }
  return errors;
}

/** Read and validate bundle.json from a transport, returning a Bundle with `.manifest` set. */
export async function openBundle(source, { expectType } = {}) {
  const bundle = source instanceof Bundle ? source : new Bundle(source);
  if (!bundle.has('bundle.json')) throw new Error('Not a bundle: bundle.json is missing');
  const manifest = await bundle.json('bundle.json');
  const errors = validateManifest(manifest, bundle.files);
  if (expectType && manifest.type !== expectType)
    errors.unshift(`Expected a ${expectType} bundle, found '${manifest.type}'`);
  if (errors.length) throw new Error(`Invalid bundle:\n- ${errors.join('\n- ')}`);
  bundle.manifest = manifest;
  return bundle;
}

/** Lowercase sha256 hex of a string's UTF-8 bytes, using Web Crypto (browser and Node). */
export async function sha256Text(text) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check every file listed in the manifest's `files` map against its digest.
 * Returns a list of problems; empty means everything matched (or nothing was listed).
 */
export async function verifyFiles(bundle) {
  const problems = [];
  for (const [p, expected] of Object.entries(bundle.manifest?.files ?? {})) {
    let actual;
    try {
      actual = await sha256Text(await bundle.text(p));
    } catch (e) {
      problems.push(`${p}: ${e.message}`);
      continue;
    }
    if (actual !== expected)
      problems.push(`${p}: sha256 mismatch (expected ${expected}, got ${actual})`);
  }
  return problems;
}
