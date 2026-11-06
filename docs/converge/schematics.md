# Schematics

A schematic is the breakdown view of a structure or station: a drawing, numbered parts, specifications
and notes. `atlas.json` carries a root `data.schematics` array. A station names an entry with
`schematic: "<key>"`. Several stations can share an entry.

```json
{
  "key": "reflector-array",
  "kicker": "STATION OVERVIEW",
  "deck": "Terranos Omnidirectional Reflector Array",
  "units": { "noun": "Array", "aria": "Reflector arrays in this system" },
  "navLabel": "…",
  "links": [{ "link": "Page title", "label": "Go to Article", "cls": "tora-article" }],
  "drawing": { "svg": "<svg class=\"tora-plate\" …>…</svg>" },
  "parts": [{ "title": "Axial mast", "label": "MAST", "x": 329, "y": 95, "lx": 420, "ly": 70, "note": "…" }],
  "specs": [["Height", "4.35 km"], ["Manufacturer", { "link": "The Imagine Corporation" }]],
  "lore": ["…"],
  "footnote": ["text ", { "link": "File:Example.png", "label": "Reference illustration ↗" }],
  "screenClass": "foundry-screen",
  "highlight": "url(#foundryAmber)",
  "openLabel": "Open Foundry schematic ↗",
  "openOnChoose": true,
  "glyph": "foundryGlyph",
  "corner": "foundryCorner"
}
```

- **Text** is a string or a link `{ link, label?, cls? }`; `"$station"` as the link means the station itself.
- **`drawing`** is `{ svg }` (markup in the data) or `{ function }`: the name of a function the atlas defines
  and called as `fn(station, system)`. The root element should carry the class `tora-plate`, which the
  "Replay build" button animates, and parts are `data-part` / `data-hardware` groups.
- **`units`** shows a switcher over all stations in the system that share the entry.
- **`glyph`** and **`corner`** name atlas functions that draw the station's symbol on the system chart and
  a launch control in the chart's corner. **`openOnChoose`** opens the screen when the station is chosen.
- **`highlight`** is the filter applied to the selected part's hardware (default `url(#toraAmber)`).

`hasStationSchematic(b)` is true when `schematicOf(b)` finds an entry. IULR's TORA stations carry
`schematic: "reflector-array"`; the entries for the Foundry (Calidor) and Circa's Triad (Elysian) came from
the previous per-structure screens, with drawings captured from them.

Changes against the previous screens: the button attribute is `data-schematic-open` (was `data-tora-open`
and `data-foundry-open`); Elysian's Triad dossier has an "Open station overview" button as the other
structures do.
