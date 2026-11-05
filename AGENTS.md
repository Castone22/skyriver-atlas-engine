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
- Do not add new Canon content or places to data as a side effect of code changes.
