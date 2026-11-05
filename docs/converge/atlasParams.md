# atlasParams

Variants merged: calidor+elysian+uacs, kadaym, iulr (3 -> 1). Result: converged, no flags.

| Difference | Resolution |
| --- | --- |
| Kadaym redirects old system names through `DATA.legacyHoldings` | Data, not code. The converged function reads `DATA.legacyHoldings?.[system]`; atlases without that table skip the redirect. |
| Calidor/Elysian/UACS use an injected `SKYRIVER_ATLAS_QUERY` whenever it is a string; Kadaym/IULR only inside an `about:srcdoc` document | Drift. Grand is the only thing that sets it and always loads children with `srcdoc`, so the two forms never differ in practice. The converged function uses the looser form (any host may inject the query), which is the union. |
| `String(input\|\|'').replace(/^\?/,'')` against passing the raw string | Drift: `URLSearchParams` already strips a leading `?`. |

Deep-link parameters are untouched.

## Questions

None.
