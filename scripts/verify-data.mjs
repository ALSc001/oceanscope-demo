import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {metricCSV} from '../src/publicData.js';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const report=await json('data/export-info.json');
for(const a of report.assets){const bytes=await readFile(a.url.replace(/^\//,''));assert.equal(bytes.length,a.bytes,a.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.url);if(a.url.endsWith('.gz'))gunzipSync(bytes)}
const manifest=await json('data/manifest.json'),fields=await json('data/field-demo.json');
for(const d of manifest.datasets){assert.equal(d.frames.length,240);assert.equal(new Set(d.sample_frames).size,d.sample_frames.length);for(let f=1048;f<=1055;f++)assert(d.sample_frames.includes(f));for(const frame of d.sample_frames)await readFile('data/'+d.mesh_pattern.replace('{frame}',frame))}
for(const c of fields.cases){for(const f of c.processing.frames)assert.equal(gunzipSync(await readFile(c.frameUrls[f.frame].replace(/^\//,''))).length,f.bytes);assert.deepEqual(c.sampledFrames,c.processing.frames.map(f=>f.frame));for(let f=1001;f<=1003;f++)assert(c.sampledFrames.includes(f))}
const cmp=fields.cases.find(c=>!c.comparison.settings.previewOnly),preview=fields.cases.find(c=>c.comparison.settings.previewOnly);
const csv=metricCSV(cmp);assert(csv.includes('"1001","sdf","mae","0.2941416819127544"'));assert(csv.includes('"1001","sdf","hd95",,'));assert(!metricCSV(preview).includes('\n'));assert.equal(Object.keys(cmp.metrics.frames).length,96);
console.log(`PASS: ${report.assets.length} asset sizes, SHA-256 hashes and gzip integrity; sample ranges and binary sizes; CSV values, missing metrics and preview exclusion.`);
