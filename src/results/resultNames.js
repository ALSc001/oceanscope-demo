export function resultExportStem(comparison){return `${comparison.labels?.prediction?.exportStem||'prediction'}_${comparison.runId||comparison.id}`.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,125)}
