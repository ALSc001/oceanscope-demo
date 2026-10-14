# OceanScope — Public Research Workbench

Interactive sample-data edition of OceanScope, with the same panel layout and analysis controls as the local viewer.

- Wave Surface: Calm / Gentle / Strong; 32 original-resolution meshes each, including consecutive frames 1048–1055. All 240 original maximum-elevation measurements remain available.
- Field Compare: a published GT / DA3 SDF comparison (7 viewable frames, 96 saved metric records) and standalone GT SDF + velocity (5 viewable frames). Both include consecutive frames 1001–1003.
- Results Library: search and filter published analyses, reopen a result, download metrics JSON, all-frame scalar-metric CSV, and dataset details. Null metrics stay empty in CSV; preview-only data has no error-score exports.
- English / Chinese navigation and guide. Workspace controls remain mounted when switching tabs; playback pauses. Wave camera presets and PNG snapshots are available.
- No raw ABC / VDB uploads, new processing jobs, or new VDB exports. Display settings do not change saved scores.

## Scientific scope

Maximum elevation is not significant wave height (Hs). Metre conversion is a declared simulation scale, not field calibration. Historical sea states use different simulation time scales. The prediction has a filled exterior: distance errors are conditional on valid GT-water support and must be read alongside coverage. Units remain undeclared when absent. Prediction surfaces are illustrative, and the results do not establish model rankings. Existing metric payloads and wave measurements are unchanged.

## Development and publication

Requires Node.js and pnpm. Run pnpm install, pnpm test, and pnpm build. pnpm dev opens the editable workbench at /workbench.html. The build prepares index.html and hashed assets/ at the repository root. Existing asset hashes are retained for already-open browser sessions.

Publish the repository root with GitHub Pages. All data loads resolve relative to the project path. data/export-info.json lists sample counts, sizes and SHA-256 hashes. pnpm test checks every published data asset, compressed-file integrity, frame ranges, binary sizes, and CSV handling of unavailable metrics.

src/ contains the public browser client only. There are no processing services, raw VDB/ABC sequences, credentials, or machine paths. Third-party notices are in THIRD_PARTY_NOTICES.md and licenses/.
