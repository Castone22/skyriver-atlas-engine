#!/usr/bin/env node
// Summarize which tour steps changed between the committed baselines and the last browser run.
//   node tools/tour-diff.mjs [atlas ...]
import { readFileSync, existsSync } from 'node:fs';
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['calidor', 'elysian', 'iulr', 'kadaym', 'uacs'];
const parse = (f) =>
  new Map(
    readFileSync(f, 'utf8')
      .trim()
      .split('\n')
      .map((l) => l.split('\t'))
  );
for (const id of ids) {
  const base = `tests/e2e/__snapshots__/${id}-tour-win32.txt`;
  const got = `test-results/tour-tour-${id}-chromium/${id}-tour-actual.txt`;
  if (!existsSync(got)) {
    console.log(id, 'no new run');
    continue;
  }
  const a = parse(base),
    b = parse(got),
    kinds = {};
  let changed = 0;
  for (const [k, h] of b)
    if (a.get(k) !== h) {
      changed++;
      const t = k.split(':')[0];
      kinds[t] = (kinds[t] || 0) + 1;
    }
  console.log(`${id}: ${changed} of ${b.size} steps changed`, JSON.stringify(kinds));
}
