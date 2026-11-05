# History

Records of how the atlases were first extracted from the standalone HTML files. Nothing in the
build or the test suites reads these (the live `docs/source-manifest.json` stays in `docs/`).

- `MIGRATION.md`, `IULR-V9-UPDATE.md`: narrative ledgers of the extraction and the IULR v9 update.
- `*.json`: machine logs written by the tools in `tools/migration/`.
- `MANIFEST.sha256`: checksums of the package as originally delivered. It is stale and nothing
  verifies it.

The tools in `tools/migration/` were written for the original layout (`engine/profiles/`, `data/`)
and need the original source HTML files, which are not in this repository. Treat them as reference,
not as working commands.
