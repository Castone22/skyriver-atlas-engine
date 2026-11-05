import { mkdir, readFile, writeFile, rename, unlink, readdir, open } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { clone, validate } from './atlas.mjs';
/** JSON-only disk repository. Atomic replace + exclusive writer lock + optimistic revision guard. */
export class FileAtlasStore {
  constructor(directory) {
    this.directory = path.resolve(directory);
  }
  _path(id) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw new Error('Invalid atlas id');
    return path.join(this.directory, id + '.json');
  }
  async load(id) {
    try {
      return JSON.parse(await readFile(this._path(id), 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }
  async list() {
    await mkdir(this.directory, { recursive: true });
    return (await readdir(this.directory))
      .filter((x) => x.endsWith('.json'))
      .map((x) => x.slice(0, -5))
      .sort();
  }
  async save(definition, { expectedRevision, strict = true } = {}) {
    const d = clone(definition),
      check = validate(d, { strict });
    if (!check.valid) throw new Error(check.errors.join('\n'));
    await mkdir(this.directory, { recursive: true });
    const dest = this._path(d.id),
      lock = dest + '.lock',
      temp = dest + '.' + randomUUID() + '.tmp';
    let handle;
    try {
      handle = await open(lock, 'wx');
    } catch (e) {
      if (e.code === 'EEXIST')
        throw new Error(`Atlas ${d.id} is being written; retry after the active writer completes`);
      throw e;
    }
    try {
      const previous = await this.load(d.id),
        revision = previous?.revision || 0;
      if (expectedRevision !== undefined && expectedRevision !== revision)
        throw new Error(`Revision conflict: expected ${expectedRevision}, found ${revision}`);
      const record = { revision: revision + 1, definition: d };
      await writeFile(temp, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
      await rename(temp, dest);
      return record;
    } finally {
      await handle.close();
      await unlink(lock);
      await unlink(temp).catch((e) => {
        if (e.code !== 'ENOENT') throw e;
      });
    }
  }
}
