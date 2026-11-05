# Agent instructions

This file is for any coding agent or contributor, whichever client or tool they use.

## What this repo is

A data-first DSL, shared renderer source and build pipeline for the Skyriver atlases. The
direction is documented in `docs/BUNDLES.md`: a generic engine bundle plus self-contained
atlas bundles, loaded client-side by the AtlasEmbed MediaWiki extension. Read that file and
`docs/ARCHITECTURE.md` before structural changes.

## Backward compatibility is a priority

One engine serves every atlas, and published atlases and wiki embeds already exist. When
changing anything, prefer the change that keeps existing behavior working.

- Existing atlas data (`data/*.json`), stable atlas, system and planet keys, and URL/query
  deep links (`system=`, `planet=`, and so on) must keep working.
- The standalone HTML output must remain a valid upload for the existing AtlasEmbed flow.
- Do not rename or remove public exports (`src/atlas.mjs`, `src/compiler.mjs`,
  `src/store.mjs`), the `window.AtlasFramework` API, or schema fields. Add new ones and
  deprecate old ones instead. Bump `schemaVersion`/bundle versions only with a migration path.
- Engine changes must not change another atlas's behavior unless that is the point of the
  change and it is called out explicitly.
- If a breaking change is truly unavoidable, stop and describe it to the maintainers first.

## Verifying a change

- `npm run build` regenerates `dist/`. For refactors, `dist/` output should be
  **byte-identical** before and after (build to a temp directory and compare with `cmp`).
- Also build `examples/new-stellar.atlas.mjs` (`node tools/build.mjs examples/new-stellar.atlas.mjs <dir>`)
  and compare it. It is the only custom-brand case; the default atlases do not exercise that path.
- `npm run test:all` runs the core and DOM suites. `npm run format:check` verifies formatting.
- Run `npm install` first; the DOM tests need dev dependencies.

## Conventions

- Format with Prettier (`npm run format`). Keep lines readable; no multi-statement one-liners.
- `engine/` function sources are embedded verbatim in output. Do not reformat them as a side
  effect of other work.
- Keep atlas-specific knowledge (names, brands, titles, per-atlas rules) out of engine and
  compiler code; it belongs in the atlas's own data.
- Never match on text to substitute per-atlas values (brand names, titles). Use template slots
  from `src/template.mjs`; see below.
- Do not add new Canon content or places to data as a side effect of code changes.

## Templating

Shells, styles and runtime entry scripts under `engine/` may contain slots rendered by
`src/template.mjs` at compile time. Syntax: `{{name}}` or `{{name|filter}}`, where `name` is a
dotted path into the slot values (today: `brand`).

Choose the filter by where the slot lands in the output:

| Filter  | Use                                                                  |
| ------- | -------------------------------------------------------------------- |
| `html`  | HTML text or attribute values. This is the default.                  |
| `js`    | A complete JS string literal, quotes included: `url({{brand\|js}})`. |
| `jsstr` | Inside a JS string you quoted yourself: `url('{{brand\|jsstr}}')`.   |
| `json`  | Any JSON value inside an inline `<script>`.                          |

Rules:

- There is no logic: no loops, conditionals or expressions. Put anything beyond substitution
  in data or code.
- An unknown slot or filter is a build error, not an empty string. Do not add fallbacks.
- Only write a slot where the text means "this atlas's own value". A literal that names another
  atlas (for example an affiliation) is content and must stay a literal.
- Shared function sources in `engine/functions/` are rendered with the same slots when linked.
  A function that names its own atlas uses `'{{brand|jsstr}}'`. A function that names _another_
  atlas keeps the literal, because that is content. If one function needs both meanings for
  different profiles, give each profile its own variant instead of sharing a file.
- Functions that differ only by a slot value are one function. Do not keep duplicate variants.
- The template module must stay free of Node imports; it has to run in a browser.
- Add a test in `tests/template.test.mjs` when adding a filter.
