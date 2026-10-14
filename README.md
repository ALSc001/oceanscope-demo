# OceanScope — Public Research Demo

A static, read-only research demonstration of cached ocean waves and precomputed fluid-field comparisons.

- Calm, Gentle and Strong: 26 original-resolution mesh samples per sea state; all 240 maximum-elevation measurements are available as CSV.
- Saved DA3 GT-free SDF comparison: five hosted 3D frames and 96 existing metric records.
- Ground Truth SDF and velocity: three hosted frames with surfaces, vectors and cross sections.
- Downloads are generated in the browser. Uploads and new server-side calculations are not included.

This repository contains only the published static application and the same selected data that was already available in the public demonstration. It does not include local application source, original VDB/ABC sequences, credentials or machine paths.

## Scientific scope

Maximum elevation is not significant wave height (Hs). The wave viewer's metre conversion is a declared simulation scale, not field calibration. Historical sea states use different simulation time scales. The saved prediction's filled exterior restricts valid distance scoring; read support and coverage together with errors. Undeclared field units remain undeclared. These examples do not establish a model ranking.

## Hosting

Publish the repository root with GitHub Pages. Relative application assets support both a domain root and a project path such as `/oceanscope-demo/`. The `.nojekyll` file preserves the prepared static build. A recent desktop browser with WebGL is recommended.

Public data integrity information and SHA-256 hashes are retained in `data/export-info.json`. Third-party software notices are in `THIRD_PARTY_NOTICES.md` and `licenses/`.
