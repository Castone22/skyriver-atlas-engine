# IULR v9 synchronization integration

## Changes

- Migrated standalone IULR v9's planet title lookup, cached page identity, canonical-name presentation, search matching, article links and live-image title resolution into the IULR compatibility profile.
- Reused 110 existing functions and added 21 explicit function variants/helpers. Notes remain declarative presentation data. Runtime code and map data remain separate.
- Preserved the entire IULR catalogue, geometry, assets and original keys. Only the catalogue edition changed from 8 to 9.
- Updated IULR's edition label, capability metadata and source provenance. Corrected a v9 Notes sentence that suggested unsupported alias/register page-ID discovery.
- Rebuilt IULR and Grand Atlas. Grand's compressed IULR snapshot decodes to exactly the rebuilt IULR document. Its other four child snapshots are unchanged.
- Added deterministic synchronization and actual-document DOM regression tests. Corrected the optional browser test's hard-coded distribution folder so it works from the delivered package directory.

## Verification

- `node tools/build.mjs`: all seven atlases built. IULR and Grand have zero warnings. The four pre-existing Kadaym source-reference warnings are unchanged.
- `node --test tests/*.test.mjs`: 22 passed, zero failed (nine original core tests and 13 synchronization/build checks).
- `node tests/dom.cjs`: all eight existing atlas scenarios passed.
- `node tests/iulr-dom.cjs`: ten focused IULR scenarios passed, using the rebuilt HTML.
- Generated JavaScript syntax: all 11 executable scripts across eight delivered HTML atlases parse successfully.
- Full catalogue and asset preservation checked against the reviewed standalone IULR v9. Other six definitions and five unrelated atlas outputs are byte-identical to the prior package.
- No live deployment, wiki edit, article creation or real article move was performed. API creation/rename responses were simulated.

The focused tests cover absent/new articles, normalization and multi-hop redirects, page-ID-backed no-redirect moves, old-title recreation, offline cached labels, failed/partial responses, unavailable/corrupt storage, batch size, concurrent refresh deduplication, polling throttle, read-only CORS request options, visible-tab triggers, manual refresh, search, navigation, dossier/orbit labels, links, image title resolution and preservation of selection, zoom, camera, URL and exported data.

## Limits

JSDOM mocks canvas/SVG geometry and is not a visual browser. Chromium was attempted but could not start because the execution environment prohibited its process socket. Live Codex API availability and browser CORS behavior were not verified.

The v9 behavior is preserved, including these existing limits:
- A browser that has never discovered a planet's page cannot find a prior no-redirect move. Keep a redirect from its original article title for new visitors.
- Cached deleted pages keep their last known title and ID rather than adopting an unrelated replacement at the old title.
- The v9 synchronizer discovers from articleTitle/name and its browser cache, not arbitrary catalogue alias/page-ID fields.
- Some secondary SVG tooltip/ARIA strings retain the stable original name. Visible planet-name and article-link synchronization is unchanged from standalone v9.

## Source

Reviewed source: `IULR-Stellar-Atlas(2).html`, SHA-256 `086360afcea27c85f78d07bc07d3138c85ef90909daad20893db0560b315ccd6`.

The optional `tools/update-iulr-v9.cjs` integration utility is pinned to that exact source and verifies catalogue preservation before modifying the profile. Normal builds do not require the source HTML or migration dependencies.
