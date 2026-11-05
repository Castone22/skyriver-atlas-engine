/**
 * Minimal slot templating for shells, styles and runtime sources.
 *
 * Syntax: {{name}} or {{name|filter}}. `name` is a dotted path into the values object.
 * The filter names the output context and defaults to `html`. There are no loops,
 * conditionals or expressions. An unknown slot or filter is an error, never an empty string.
 *
 * This module has no Node imports so it can run in a browser.
 */

/** JSON that is safe inside an inline <script>. */
export const safeJSON = (x) =>
  JSON.stringify(x)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export const escapeHTML = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

export const filters = {
  /** HTML text or attribute value. */
  html: escapeHTML,
  /** A complete JS string literal, quotes included. */
  js: (v) => safeJSON(String(v)),
  /** The inside of a JS string literal in either quote style. The caller supplies the quotes. */
  jsstr: (v) => safeJSON(String(v)).slice(1, -1).replace(/'/g, "\\'"),
  /** Any JSON value, safe inside an inline <script>. */
  json: safeJSON
};

const SLOT = /\{\{\s*([\w.]+)(?:\|(\w+))?\s*\}\}/g;

/**
 * Replace every slot in `text`.
 * @param {string} text template source
 * @param {object} values slot values
 * @param {string} [source] name used in error messages
 */
export function render(text, values, source = 'template') {
  return text.replace(SLOT, (_, key, filter = 'html') => {
    const value = key.split('.').reduce((o, k) => o?.[k], values);
    if (value === undefined || value === null)
      throw new Error(`${source}: unknown slot {{${key}}}`);
    if (!Object.hasOwn(filters, filter)) throw new Error(`${source}: unknown filter '${filter}'`);
    return filters[filter](value);
  });
}
