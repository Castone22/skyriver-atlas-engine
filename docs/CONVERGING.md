# Converging function variants

`engine/functions/` holds several variants of many functions, one per atlas that had its own
fork. The goal is one function per name that supports the union of the variants' features, with
each atlas choosing what it uses through flags, data and hooks. See the rules in `AGENTS.md`
("Converging function variants"); this page is the procedure.

## Where things live

| What | Where | Read in the page as |
| --- | --- | --- |
| Capability switches | `engine/flags.json` (registry: description and default) and `bundles/<id>/bundle.json` `flags` | `__ATLAS__.flags.name` |
| Policy numbers (label thresholds and similar) | `policies` in `bundles/<id>/atlas.json` | `__ATLAS__.policies` |
| Per-atlas wording and file names | `slots` in `bundle.json` | `'{{name\|jsstr}}'` in the function source |
| Content (aliases, names of systems) | `bundles/<id>/atlas.json` | the data (`DATA`) |
| Atlas-specific behaviour | a small function the atlas defines under one agreed name | called by the shared function |
| Shared page state (`view`, `selected`, ...) | declared by each atlas runtime | read as a global |

A flag must be declared in `engine/flags.json` before a bundle can set it; an unknown name fails the
build. Every flag defaults to **off** (or to the value that reproduces the oldest behaviour); an
atlas that had the feature sets it on in its `bundle.json`. Name flags for the capability
(`highlightRegion`), not for the atlas that had it first.

## Procedure for one function group

1. **List the variants** (`engine/function-index.json`, or `node tools/dedup-normalize.mjs --show
   <name>`) and **diff them**. Classify every difference:
   - _drift_: local names, quoting, statement order, equivalent expressions. Pick one spelling.
   - _same concept, different global name_: rename it everywhere with `tools/rename-global.mjs`
     (it uses the syntax tree). Do not hand-edit with search and replace.
   - _content in code_ (a hard-coded system or faction name): move it into the atlas data.
   - _a capability only some variants have_: keep it in the converged function behind a flag.
   - _atlas-specific behaviour_ (for example resolving a display title): a hook the atlas defines.
   - _missing page state_ the converged function assigns or reads: declare it in the atlases that
     lack it.
   - _a bug in one variant_: do not decide alone. Keep the behaviour of the atlas as it is and
     record the question in the group's notes file.
2. **Write the converged function** as `engine/functions/<name>.js`. The canonical file has no
   hash or suffix: a suffix only tells variants apart, and a converged function has none. If the
   name is still taken by a variant you have not removed yet, use a temporary `<name>-new.js` and
   let step 4 rename it. Keep formatting close to the source variants.
3. **Point every atlas at it**: change the `@atlas-function` marker in `bundles/<id>/runtime-*.js`.
   Set the flags each atlas needs in its `bundle.json` so it behaves exactly as before.
4. **Remove the old variants** and regenerate the index. Do not edit the index by hand:
   `node tools/index-functions.mjs --prune --fix-names --unhash`. `--unhash` renames any function
   that now has a single linked file to `<name>.js` and updates the markers.
5. **Verify** with `npm run check:full` (build, unit tests, DOM tests, browser tests).
   A converged function must leave every tour step unchanged for every atlas. If a step differs,
   the flags for that atlas are wrong or a difference was missed; fix it, do not update the
   baselines.
6. **Write notes** in `docs/converge/<name>.md`: what differed, how each difference was resolved
   (flag, hook, data, rename), and anything left for a decision. One file per group, so work on
   different groups never conflicts.

## Verification notes

- **Similarity scores hide differences inside template literals** (a whole template literal is one
  token), and the large render functions are mostly template literals. Diff those by hand, or tokenise
  inside them, before trusting a number.

- The browser tour drives every region, system, planet, satellite and station, the station screens,
  search, scope and filter controls, zoom and fit, panel toggles and map keys. The screenshots cover CSS
  and layout. Widget mode has its own tests; saved history state and hash routes are checked by hand.
- `npm run check:full` runs the complete tours (about ten minutes with two jobs). Run it before
  merging a batch. Memory is the limit: each tour is a jsdom page, so keep `--jobs` low.
- Golden files are the contract. They change only when a behaviour change is intended and agreed.
