# Brief for the AtlasEmbed extension: serving atlas bundles

For whoever changes the MediaWiki extension `AtlasEmbed`. It is self-contained: you do not need to
read the atlas framework to do this, but the repository it comes from is the source of truth for the
formats (`docs/BUNDLES.md`, `docs/TRANSPORTS.md`, `src/bundle.mjs`, `tools/bundle-manifest.mjs`,
`tools/build-loader.mjs`). Where this brief and `docs/TRANSPORTS.md` differ, `TRANSPORTS.md` wins.

## Goal

Today one slug is one uploaded self-contained `.html` file, served from `Special:AtlasEmbed/<slug>`
inside a sandboxed iframe. The framework can now also produce atlases as **bundles**: a small set of
text files that a browser assembles at view time. That removes the 1 to 8 MB per atlas upload and lets
all atlases share one engine, which browsers cache.

You add a second kind of slug, **bundle**, next to the existing **html** kind. Nothing about html slugs
changes.

## What must stay exactly as it is

- Existing html slugs, their storage, upload and delete, the `<atlasembed>` tag, deep-link `query=`
  passthrough, the right `atlasembed-upload`, the log type `atlasembed`, the 20 MB cap, the slug
  pattern `^[a-z0-9][a-z0-9-]{0,79}$`, and the response header
  `Content-Security-Policy: sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox`
  (no `allow-same-origin`) on every page that runs atlas code.
- Slugs form one namespace. A bundle slug and an html slug cannot share a name.

## What to build

### 1. Storage
Under `$wgAtlasEmbedStorageDirectory` (never aliased by the web server), alongside the existing files:

```
engine/<version>/…        one directory per engine release, immutable once written
bundles/<id>/…            one directory per atlas bundle
assets/<sha256>           images, content-addressed
```

Add a `kind` column (`html` | `bundle`) to `atlasembed_file`, default `html`, via the normal
`update.php` schema patch. Engine releases and the "current engine" pointer need records too (a table
or a setting; your choice). Replace a bundle atomically (write a temp directory, then rename).

### 2. Upload (new special page or a new mode of the existing one)
Accept a **zip** of one atlas bundle (a directory containing `bundle.json`) or of one engine release.
Unpack it yourself; do not trust anything inside it.

Validate, and reject with a clear message on any failure:
- Zip safety: no `..`, absolute paths, backslashes or symlinks; a cap on file count and total size.
- Only text files with these extensions: `.json .html .css .js`. Every file must be valid UTF-8.
- `bundle.json` is JSON with `bundleVersion` 1, `type` `atlas` or `engine`, a version `x.y.z`, and for
  an atlas: `id` matching `^[a-z0-9][a-z0-9_-]*$`, `kind`, `brand`, `engine` (a range such as `^1.0.0`),
  and every file named in `atlas`, `parts.shell`, `parts.styles[]`, `parts.runtime[].path` must exist.
  The exact rules are `validateManifest` in `src/bundle.mjs`; port them, and test with the fixtures there.
- The upload must **not** supply `files`. You compute it (below).
- For an atlas bundle, the id is the slug (it must also match the slug pattern, so no underscores).

**Compute `files`.** After unpacking, set `bundle.json` `files` to an object mapping every file's
path (relative, `/` separators, every file except `bundle.json` itself) to the lowercase hex SHA-256
of that file's **UTF-8 bytes**. Rewrite `bundle.json` with it. `tools/bundle-manifest.mjs` is the
reference (`computeFiles`); your result must be identical, byte for byte, for the same input.

**Engine upload:** the version comes from its `bundle.json`; refuse to overwrite an existing
version with different content. **Assets** (`atlas-asset:<sha256>` references in atlas data) go in
`assets/<sha256>`: accept PNG, WebP, JPEG or GIF only (never SVG), verify the name equals the
SHA-256 of the bytes, and store the media type. Let a bundle zip carry an `assets/` folder, or add a
separate asset upload; either is fine.

### 3. Serving files (the important safety part)
Make these URLs answer plain `GET`s (you may use a special page or the web server; the cold load makes
about 140 requests for a stellar atlas, so keep it cheap):

```
{engineUrl}                      the current engine bundle directory
{bundlesUrl}<id>/<path>          a file of an atlas bundle
{assetsUrl}<sha256>              an asset
```

Rules:
- **404** for an unknown id, path or hash. The loader treats 404 as "no such bundle".
- **`Access-Control-Allow-Origin: *`** on every file and asset. The loader runs in an opaque-origin
  sandbox, so every request is cross-origin. No credentials, so the wildcard is valid.
- **Never serve a bundle file as `text/html` or `image/svg+xml` on the wiki origin.** A `shell.html` or
  `runtime.js` opened directly would run with the wiki's cookies. Serve all bundle text files as
  `text/plain; charset=utf-8` with `X-Content-Type-Options: nosniff` and
  `Content-Security-Policy: sandbox`. The loader reads them with `fetch` as text, so the type does not
  matter to it. Serve assets with their image type plus `nosniff`.
- Caching: `bundle.json` gets `Cache-Control: no-cache` (use an `ETag`). Other bundle files are
  immutable once their URL carries `?v=<first 16 hex of the file's sha256>` (ignore the query string
  when locating the file) and may use `public, max-age=31536000, immutable`. Assets are immutable.
- Send no cookies and no `Set-Cookie` on these responses.

### 4. The loader page for bundle slugs
`Special:AtlasEmbed/<slug>` for a bundle slug returns the **loader**, one HTML document the framework
builds with `node tools/build-loader.mjs` (output `build/loader.html`). Ship that file with the
extension as a resource and refresh it when the framework changes. Fill its two placeholders with
`strtr` (never sequential `str_replace`):

```php
$config = json_encode( [
    'atlas'        => $slug,
    'engineUrl'    => $engineUrl,    // directory URL of the current engine, ending in /
    'bundlesUrl'   => $bundlesUrl,   // prefix ending in /
    'assetsUrl'    => $assetsUrl,    // prefix ending in /
    'versionParam' => 'v',
], JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES );
$html = strtr( $loaderHtml, [ '@@TITLE@@' => htmlspecialchars( $title ), '@@CONFIG@@' => $config ] );
```

Send the existing sandbox CSP header and `Cache-Control: no-cache`. The iframe `src` query string must
still reach the page untouched, because the atlas reads `?system=…&planet=…` from it.

### 5. Current engine setting
One wiki-wide setting (`$wgAtlasEmbedCurrentEngine = '1.0.0'`, or a row edited from an admin page)
names the engine every bundle slug renders with. Engines are immutable, so rolling back a bad release is
changing this value. Block deleting an engine version while it is current.

### 6. Management and logging
List bundles and engine releases next to the html atlases: kind, version, size, uploader, time, an
embed tag to copy, delete. Log uploads and deletes under the existing `atlasembed` log type. Same right
(`atlasembed-upload`) for everything.

### 7. The `<atlasembed>` tag
Unchanged. A bundle slug works exactly like an html slug (`slug`, `height`, `width`, `title`, `query`).

## Things that need the right ids

A galaxy atlas (`grand`) loads its child atlases by **bundle id**: `elysian`, `uacs`, `calidor`,
`kadaym`, `iulr` must exist as bundles under exactly those ids. A "DSL" atlas can also name another
bundle as its `renderer` (the example atlas uses `elysian`). So bundle ids are not the same as the
current html slugs (`kadaym-stellar-atlas` and so on); expect both to coexist.

## Testing

- PHPUnit: bundle validation (accept the seven bundles in the repo; reject each rule above), the
  `files` hash (one fixture file with a known SHA-256 must match the Node tool), zip-slip and
  oversize rejection, header assertions (CORS, `nosniff`, `text/plain`, CSP), 404 behaviour.
- Smoke test: zip `engine/` and `bundles/calidor/` from the repository and upload them. Open
  `Special:AtlasEmbed/calidor`. It must look and behave identically to the committed
  `dist/calidor-atlas.html` (same map, same search, deep links such as `?system=…` work). Then upload
  all seven bundles and open `grand`; the five child atlases must load.
- Check in a real browser's network tab: no request is blocked by CORS, `bundle.json` revalidates,
  and a second atlas reuses the cached engine files.

## Do not

- Do not accept `files` from an upload, rewrite any other file, or inline assets into bundles.
- Do not serve bundle files as `text/html`, `application/javascript` or SVG on the wiki origin.
- Do not add `allow-same-origin`, `allow-forms`, `allow-modals` or `allow-top-navigation` to the
  sandbox header, and do not add a `connect-src` that blocks the bundle host.
- Do not change how html slugs behave.

## Questions to settle with the maintainers

- Zip only, or also tar.gz? Should assets be a separate upload?
- Should the bundle editor eventually live in the `MediaWiki:` namespace (editable pages) instead of
  uploads?
- Who may change the current engine: the same group as upload, or a stricter right?
