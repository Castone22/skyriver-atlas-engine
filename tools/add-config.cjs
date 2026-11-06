#!/usr/bin/env node
// Helper for convergence work: add flags to engine/flags.json, default slots to engine/bundle.json,
// and per-atlas flags and slots to bundles/<id>/bundle.json.
//   node tools/add-config.cjs spec.json
// spec: { flags: {name:{description,default}}, defaults: {slotName: text}, atlases: {id:{flags:{},slots:{}}} }
const fs = require('fs');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const write = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
if (spec.flags) {
  const reg = JSON.parse(fs.readFileSync('engine/flags.json', 'utf8'));
  Object.assign(reg, spec.flags);
  write(
    'engine/flags.json',
    Object.fromEntries(Object.entries(reg).sort(([a], [b]) => a.localeCompare(b)))
  );
}
if (spec.defaults) {
  const m = JSON.parse(fs.readFileSync('engine/bundle.json', 'utf8'));
  m.defaults ??= {};
  m.defaults.stellar ??= {};
  m.defaults.stellar.slots = { ...m.defaults.stellar.slots, ...spec.defaults };
  write('engine/bundle.json', m);
}
for (const [id, a] of Object.entries(spec.atlases ?? {})) {
  const f = `bundles/${id}/bundle.json`;
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (a.flags) m.flags = { ...m.flags, ...a.flags };
  if (a.slots) m.slots = { ...m.slots, ...a.slots };
  write(f, m);
}
