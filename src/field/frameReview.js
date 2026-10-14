export function reviewFrames(rows,metric,threshold=.9){
 const finite=rows.filter(r=>Number.isFinite(r.values[metric?.id]));
 const worst=metric?.direction==='Context'?[]:[...finite].sort((a,b)=>(metric?.direction==='Higher'?1:-1)*(a.values[metric.id]-b.values[metric.id])||a.frame-b.frame).slice(0,5);
 return {worst,lowCoverage:rows.filter(r=>Number.isFinite(r.values[`${metric?.group}.coverage`])&&r.values[`${metric.group}.coverage`]<threshold),unavailable:rows.filter(r=>!Number.isFinite(r.values[metric?.id]))};
}
const cell=v=>`"${String(v??'undeclared').replaceAll('"','""')}"`;
export function protocolCsv(report,model,manifest){
 const entries=[['report_identifier',model],['frame_subset',report.frameSubset],['frame_numbers',report.rows.map(r=>r.frame).join(';')],['frame_count',report.rows.length],['status',report.complete?'complete':'partial'],['sdf_error_region',report.evaluationRegion],['units',JSON.stringify(report.columns.map(c=>({metric:c.id,unit:c.unit})))],['sdf_declarations',JSON.stringify(report.sdfValidation)],['split_manifest_sha256',manifest?.sha256],['aggregation','Equal weight per valid frame; mean of frame RMSE, not pooled voxel RMSE. N/A excluded, never zero.'],['valid_counts',JSON.stringify(report.summary.map(s=>({metric:s.id,valid:s.valid,total:s.total})))],['limitations','SDF error is not wave-height error. Read error with coverage. Frame numbers do not certify physical-time alignment. Split membership is declared, not independently verified. Exterior-filled distances are conditional, not full-domain accuracy.'],['provenance','Use the saved-result ZIP for source identities and full scoring protocol. This notes file describes the currently selected report subset.']];
 return [['field','value'],...entries].map(row=>row.map(cell).join(',')).join('\r\n');
}
