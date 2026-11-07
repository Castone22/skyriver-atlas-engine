/**
 * Client-side atlas loader. It runs in a sandboxed, opaque-origin document, so it relies only on
 * fetch (CORS), never on storage or same-origin access. See docs/TRANSPORTS.md.
 *
 * config = {
 *   atlas:      id of the atlas bundle to render (this is also the wiki slug),
 *   engineUrl:  directory URL of the engine bundle,
 *   bundlesUrl: URL prefix ending in '/'; atlas bundle <id> lives at <bundlesUrl><id>/,
 *   assetsUrl:  optional URL prefix for images the engine does not carry; <sha256> lives at
 *               <assetsUrl><sha256>. Images the engine carries need no address,
 *   wikiBase:   optional; address of this wiki (https://wiki.example), used to look up article titles.
 *               Without it the engine's default is used,
 *   verify:     optional, hash each file while loading and compare with the manifest
 *   versionParam: optional query parameter name; file URLs get ?<name>=<sha256 prefix>
 * }
 */
import { compileCore } from '../src/compile-core.mjs';
import { createBrowserHost } from '../src/host-browser.mjs';

function showError(doc, error) {
  const target = doc.getElementById('status') || doc.body;
  target.textContent = `Could not load this atlas: ${error.message}`;
}

/** Load, compile and render the configured atlas into `doc`. */
export async function boot(config, doc = document) {
  try {
    const host = createBrowserHost({
      engineUrl: config.engineUrl,
      atlasUrl: (id) => config.bundlesUrl + encodeURIComponent(id) + '/',
      assetUrl: config.assetsUrl ? (sha256) => config.assetsUrl + sha256 : undefined,
      wikiBase: config.wikiBase || undefined,
      verify: config.verify === true,
      versionParam: config.versionParam
    });
    const bundle = await host.atlas(config.atlas);
    if (!bundle) throw new Error(`atlas bundle '${config.atlas}' was not found`);
    const definition = await bundle.json(bundle.manifest.atlas ?? 'atlas.json');
    const { html } = await compileCore(definition, host);
    // Replace this document in place so its URL, and therefore the deep-link query, is kept.
    doc.open();
    doc.write(html);
    doc.close();
  } catch (error) {
    console.error(error);
    showError(doc, error);
  }
}
