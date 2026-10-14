// The public edition reads published samples only; it has no processing API.
const publicCases = new Map();
const readOnlyError = () => Promise.reject(new Error('This public demonstration is read-only.'));

export function registerPublicFieldCases(cases) {
  publicCases.clear();
  for (const item of cases) publicCases.set(item.comparison.id, item);
}

export async function decodePublishedFieldBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  // Hosts may decode Content-Encoding automatically: inspect the body instead
  // of the filename so an already-decoded response is not inflated twice.
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decode the field samples. Please use a recent Chrome, Edge, Firefox or Safari.');
    }
    return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  return buffer;
}

export async function loadFieldFrame(comparisonId, frame, options = {}) {
  const item = publicCases.get(comparisonId);
  const url = item?.frameUrls?.[String(frame)];
  if (!url) throw new Error(`Frame ${frame} is not included in this public preview.`);
  if (!/^\/?data\/[a-zA-Z0-9_./-]+$/.test(url) || url.split('/').includes('..')) {
    throw new Error('Invalid published field URL.');
  }
  const response = await fetch(url.replace(/^\//,''), {signal: options.signal});
  if (!response.ok) throw new Error(`Field sample unavailable (${response.status}).`);
  const buffer = await response.arrayBuffer();
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return decodePublishedFieldBuffer(buffer);
}

export async function loadFieldMetrics(comparisonId) {
  const item = publicCases.get(comparisonId);
  if (!item) throw new Error('Unknown public comparison.');
  return item.metrics ?? null;
}

export const importFieldDataset = readOnlyError;
export const listFieldDatasets = readOnlyError;
export const previewFieldDataset = readOnlyError;
export const createFieldComparison = readOnlyError;
export const getFieldJob = readOnlyError;
export const exportFieldVdb = readOnlyError;
