# Brief for the AtlasEmbed extension: engines and atlas datapacks

For whoever changes the MediaWiki extension `AtlasEmbed`. This says **what we need**; how to build it
(storage, schema, interface, code structure) is your decision. Where something here is a fixed
contract with the browser-side code, it says so. `docs/TRANSPORTS.md` has the exact wire details of
that contract, and `docs/BUNDLES.md` the formats; where they differ from this brief, they win.

## What we want

1. **Upload an atlas engine.** An engine is a versioned bundle of the shared page code. Several can be
   stored side by side: for example a stellar engine and a surface-map engine, which differ a lot, and
   several versions of each. Engines never change once stored; a fix is a new version.
2. **Upload an atlas datapack.** A datapack (called a "bundle" in the framework) is one atlas: a few
   small text files. It is much smaller than today's single-file upload.
3. **Choose the engine for each datapack** when uploading or configuring it, from the engines already
   stored, and be able to change that choice later. That is how an atlas moves to a newer engine, or
   goes back to an older one.
4. **View them** exactly like today: `Special:AtlasEmbed/<slug>` inside the sandboxed iframe, embedded
   with `<atlasembed slug=… query=…>`, deep links working.

Existing single-file HTML slugs keep working exactly as they do now, and share the same slug namespace.

## Engines and compatibility

An engine's `bundle.json` gives its `id` (which kind of engine it is), `version`, and `kinds` (the
atlas kinds it can render: `stellar`, `geographic`, `galaxy`). A datapack's `bundle.json` gives its
`kind` and an `engine` version range such as `^1.0.0`.

- When choosing an engine for a datapack, offer only compatible engines: one whose `kinds` includes the
  datapack's `kind` and whose `version` satisfies the datapack's `engine` range. Refuse incompatible
  choices with a clear message. (The browser also checks and shows an error, but catch it earlier.)
- A `galaxy` datapack loads other datapacks as children (listed in its data). The children are
  rendered by the parent's engine, so that engine must support the children's kinds too. Warn or
  refuse when a child is missing or incompatible.
- Do not allow deleting an engine that datapacks still use.

## Datapack and engine uploads

- Accept an archive of a bundle (zip is fine; choose what you like). Extract it safely and reject
  anything unsafe or malformed. Bundle files are text only (`.json .html .css .js`, UTF-8).
- Validate `bundle.json` against the rules in `src/bundle.mjs` (`validateManifest`): the required fields,
  safe relative paths, and that every file the manifest names is present. The atlas `id` is the slug,
  so it must also fit the existing slug rule.
- **You compute the `files` map; never accept it from an upload.** It maps every file in the bundle
  (except `bundle.json`) to the lowercase hex SHA-256 of that file's UTF-8 bytes, and must be written
  into the served `bundle.json`. `tools/bundle-manifest.mjs` is the reference; your output must be
  identical for the same input.
- Images that datapacks reference (`atlas-asset:<sha256>`) are stored by SHA-256 and served by hash.
  Allow raster images only (PNG, WebP, JPEG, GIF), never SVG, and check the name matches the content.
- Re-uploading a datapack replaces it. Re-uploading an existing engine version is refused unless the
  content is identical.
- Same permission and the same log type as today are fine; add whatever you need to see what is stored,
  its engine, who uploaded it and when, and to delete it.

## What the browser-side code requires (fixed contract)

The viewer is a loader page that fetches files and builds the atlas in the browser, inside the existing
sandbox. For a datapack slug, `Special:AtlasEmbed/<slug>` must return that loader, configured with the
URLs of **the engine chosen for that datapack**. Details (config keys, placeholders, the exact URL
shapes) are in `docs/TRANSPORTS.md`; build the loader with `node tools/build-loader.mjs`.

- The URLs it requests: the chosen engine's `bundle.json` and files, each needed datapack's
  `bundle.json` and files (by bundle id), and assets by hash. Unknown ids must answer 404.
- Every one of those responses needs `Access-Control-Allow-Origin: *` (the page is an opaque-origin
  sandbox, so everything is cross-origin) and no cookies.
- Caching: `bundle.json` and the loader must revalidate; other files may be cached forever because
  their URL carries a content hash.
- The loader page keeps today's `Content-Security-Policy: sandbox allow-scripts allow-downloads
  allow-popups allow-popups-to-escape-sandbox`, and the iframe's query string must still reach the atlas.
- **Never serve a bundle file as `text/html`, JavaScript or SVG from the wiki origin.** Opened directly
  it would run with the wiki's cookies. Serve bundle text as `text/plain` with `nosniff` and a sandbox
  CSP; serve images with their image type and `nosniff`.
- Child datapacks are fetched by bundle id, so a galaxy atlas needs its children stored under exactly
  the ids it lists (today: `elysian`, `uacs`, `calidor`, `kadaym`, `iulr`). These ids are not the
  existing HTML slugs (`kadaym-stellar-atlas` and so on); both sets will coexist.

## Done when

- The seven datapacks in `bundles/` and the engine in `engine/` upload, each datapack is attached to
  that engine, and `Special:AtlasEmbed/calidor` looks and behaves like `dist/calidor-atlas.html`,
  including `?system=…` deep links. `grand` loads its five children.
- A second, deliberately different engine (for example a copy with another `id`/version) can be stored
  alongside, a datapack can be switched between them, and incompatible choices are refused.
- The `files` digests match `tools/bundle-manifest.mjs` for the same input, and a hostile archive
  (path traversal, oversize, wrong types) is rejected.
- In a browser: no request is blocked by CORS, bundle files cannot be opened as a page, and a second
  atlas on the same engine reuses its cached files.
- HTML slugs behave as before.

## Open questions for the maintainers

- Archive formats (zip only?) and whether images are uploaded with the datapack or separately.
- Who may add engines or switch a datapack's engine: the existing upload right, or a stricter one.
- Whether datapacks should later be editable on-wiki (the `MediaWiki:` namespace) rather than uploaded.
