# Architecture and extension contracts

The source boundary is:

**JS DSL → versioned JSON → validation → shared-function linker + renderer profile + assets → standalone HTML.**

## Why a source linker

The original renderer functions close over a large set of local variables: selection state, camera state, `DATA`, DOM helpers, animation clocks and caches. Moving those functions unchanged into ES modules would break their lexical dependencies. Copying each whole runtime into a map-specific module would merely move the original duplication.

Instead, a profile's runtime references shared function sources by marker. The compiler links those sources back into the profile's lexical scope. Identical functions are maintained once; behaviorally different implementations remain named variants. There is no runtime string evaluation. The input map remains plain data, and generated HTML remains compatible with the existing embedded-atlas importer and Grand Atlas's `const DATA = {...}` reader.

This is deliberately a build-time framework. The profiles are compatibility adapters, not separate copies of entire embedded map applications. Their HTML/CSS expresses UI layout; catalogues, geometry, assets, notes and label calibrations live outside executable renderer functions.

## Shared function edits

Use `engine/function-index.json` to identify every consuming profile. A function with a single linked file is named `<name>.js`; while a name still has several variants, each carries a hash suffix. Regenerate the index with `node tools/index-functions.mjs --prune --fix-names --unhash` instead of editing it by hand. See `docs/CONVERGING.md`. Edit the shared implementation and run all relevant DOM tests. If one profile needs a different contract, create an explicit variant and update that profile's marker. Do not paste the same fixed body into multiple profiles.

The linker fails if a referenced file is absent. Each executable script keeps its original ordering and lexical scope. Nested private helpers stay in their owner function. Do not move stateful initialization expressions into shared data; arrays and maps used as accumulators must remain freshly allocated at their original call sites.

## Data invariants

- Atlas IDs and system IDs are stable identifiers. Existing planet catalogue keys remain stable; display/article titles are separate fields.
- A system's `worlds` list can contain catalogued stations or other named objects as well as planets. Validation checks the complete body registry before flagging a missing world.
- Moon and station parents may be planets or moons. Parent validation includes satellites.
- Original extension fields survive JSON import/export. This includes image provenance, proposals, orbital hosts, source status, historical records and classified objects.
- `.build()` validates new authoring strictly. Migrated modules use `{strict:false}` only to preserve identified source references. Structural errors, duplicate system IDs, malformed outlines, nonfinite coordinates and unsupported schema versions remain errors.
- Source definitions are never mutated by `compile()`. Runtime caches operate on separate browser data.
- Explicit HTML presentation notes and JS authoring modules are trusted author input. Do not accept untrusted modules or `notesHTML` from anonymous uploads.

## Renderer profiles and capability composition

The current profile boundary intentionally retains the full working source behavior. Planet article title synchronizers differ between Elysian, UACS and IULR v9. IULR uses separate page-ID/title maps, retaining original catalogue keys; its display and lookup adapters are explicit variants. Kadaym and IULR use different camera/highlight semantics. The Foundry, Triad, solar glyphs, and geographic globe each have distinct drawing contracts. These are not represented as fake universal toggles.

`engine/capabilities.json` records where capabilities exist. New optional modules should expose a documented hook and be covered by a cross-profile fixture before being marked portable. Label policies for Elysian/UACS/Calidor already share one configurable implementation. Profile-specific defaults live in catalogue policy data.

To add a renderer, create an atlas bundle under `bundles/<id>/` whose `bundle.json` declares its kind, brand, shell, stylesheets and ordered runtime scripts (see `docs/BUNDLES.md`), with its catalogue in `atlas.json`, and add capability metadata. Prefer sharing existing functions when the lexical and behavioral contracts match. Do not add map records to renderer code.

## Assets

The asset manifest maps SHA-256 IDs to local image bytes and MIME types. Definitions reference `atlas-asset:<hash>`. Compilation resolves them to data URLs. Existing `asset:codex_…` references inside catalogue records continue to resolve through each catalogue's asset dictionary. The distinction is intentional: one is a package asset reference; the other is the original renderer's dictionary key.

## Grand Atlas composition

The authoritative Grand definition stores empire seeds, scene settings, child catalogue references and the historical affiliation baseline. It does not store old child HTML snapshots or a duplicated search catalogue.

A build obtains current child definitions, compiles them, gzips their portable HTML, and regenerates the location indexes. Full-project builds reuse child results already compiled. A direct Grand build resolves its declared child IDs from `bundles/`.

The affiliation baseline must not be regenerated merely because a catalogue changed. It exists to detect an explicit transfer between Elysian and Kadaym affiliation. The policy then chooses the appropriate source while preserving the default Elysian Drayson / Kadaym Kevak priority.

## Persistence

The file repository stores `{revision, definition}` JSON envelopes. Validation precedes the write. An exclusive lock serializes writers, a temporary file avoids partial replacement, and an expected revision prevents stale writes. Loading never evaluates code. Compilation accepts the inner `definition`, not the repository envelope.

## Distribution

`dist/` files are generated deployment artifacts. Their data and code are colocated for portability only; source editing happens upstream. The included HTML may be uploaded using the same Codex importer as before. This extraction does not deploy anything, change article content, or add canonical places.
