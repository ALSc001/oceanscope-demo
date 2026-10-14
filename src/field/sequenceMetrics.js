import {METRIC_DEFINITIONS} from './metricDefinitions.js';
import {frameMembership,matchesFrameSubset} from './frameMembership.js';
import {predictionType} from './predictionType.js';
import {describe} from './descriptiveStats.js';
import {predictionHorizon} from './predictionHorizon.js';

const UNITS={length:'m',speed:'m/s',inverseTime:'1/s',degrees:'degrees',fraction:'fraction',dimensionless:'dimensionless'};
export function metricColumns(groups,units={}){
 return groups.flatMap(group=>METRIC_DEFINITIONS.filter(d=>d.group===group||(d.group==='both'&&group!=='elevation')).flatMap(d=>{
  const unit=d.unitKind==='length'?(units.sdf??'m'):d.unitKind==='speed'?(units.velocity??'m/s'):d.unitKind==='inverseTime'&&units.velocity&&units.velocity!=='m/s'?`(${units.velocity}) / length`:UNITS[d.unitKind];
  const base={group,key:d.id,label:d.label,unit,direction:d.direction};
  return d.id==='componentMae'||d.id==='componentRmse'?['x','y','z'].map((axis,index)=>({...base,id:`${group}.${d.id}.${axis}`,index,label:`${d.id==='componentMae'?'Component MAE':'Component RMSE'} ${axis.toUpperCase()}`})):[{...base,id:`${group}.${d.id}`}];
 }));
}
export function buildSequenceReport({metrics,frames=[],expectedFrames=[],groups=[],status,units,frameSplit,frameSubset='all'}){
 const conditional=Object.values(metrics?.settings?.sdf||{}).some(c=>c?.semantics==='water_interior');
 const evaluationRegion=conditional?'gt_water_common_distance_support':metrics?.settings?.sdfEvaluationRegion||'full_domain';
 const columns=metricColumns(groups,units).map(c=>({...c,label:c.label+(conditional&&c.group==='sdf'?(['fluidIoU','dice','signAccuracy','symmetricMeanSurfaceDistance','hd95'].includes(c.key)?' (full domain)':' (conditional GT-water support)'):'')+(evaluationRegion==='gt_water'&&c.group==='sdf'?(['fluidIoU','dice','symmetricMeanSurfaceDistance','hd95'].includes(c.key)?' (full domain)':' (GT water)'):'')})),available=new Set(frames);
 const numbers=[...expectedFrames,...frames,...Object.keys(metrics?.frames||{}).map(Number),...(metrics?.missingPredictionFrames||[])];
 const declarations=new Map((frameSplit?.rows??[]).map(r=>[r.frame,r]));
 const all=[...new Set(numbers.filter(Number.isInteger))].sort((a,b)=>a-b).filter(f=>matchesFrameSubset(declarations,f,frameSubset));
 const rows=all.map(frame=>{
  const data=metrics?.frames?.[frame],values={};
  for(const c of columns){const group=data?.[c.group];const raw=group?.[c.key];const v=c.index===undefined?raw:raw?.[c.index];values[c.id]=!group?.blocked&&Number.isFinite(v)?v:null;}
  const reason=groups.filter(g=>g!=='elevation'&&data?.[g]?.blocked).map(g=>`${g}: ${data[g].reason||'Scoring blocked'}`).join('; ');
  const declaration=declarations.get(frame);
  return {frame,elevationAudit:data?.elevation??null,algorithmVersion:metrics?.algorithmVersion??'legacy undeclared',split:frameMembership(declarations,frame),predictionType:predictionType(declarations,frame),predictionOriginFrame:declaration?.prediction_origin_frame??null,fps:declaration?.fps??null,horizonSeconds:predictionHorizon(declaration),available:available.has(frame),calculated:Boolean(data),reason,values};
 });
 const summary=columns.map(c=>{
  const values=rows.map(r=>r.values[c.id]).filter(Number.isFinite);const n=values.length;
  // Divide before summing to avoid overflow for otherwise representable means.
  const mean=n?values.reduce((sum,v)=>sum+v/n,0):null;
  return {...c,mean,...describe(values),minimum:n?values.reduce((a,b)=>Math.min(a,b)):null,maximum:n?values.reduce((a,b)=>Math.max(a,b)):null,valid:n,excluded:rows.length-n,total:rows.length};
 });
 const blockedReasons=[...new Set(all.flatMap(frame=>groups.filter(g=>g!=='elevation').flatMap(group=>metrics?.frames?.[frame]?.[group]?.blocked?[`${group.toUpperCase()}: ${metrics.frames[frame][group].reason||'Scoring prerequisites not met'}`]:[])))];
 return {columns,rows,summary,blockedReasons,evaluationRegion,frameSubset,sdfValidation:metrics?.settings?.sdf||{},total:rows.length,calculated:rows.filter(r=>r.calculated).length,complete:status==='ready'&&rows.length>0&&rows.every(r=>r.calculated)&&!blockedReasons.length,status};
}
export function formatMetric(value){return Number.isFinite(value)?Number(value.toPrecision(6)).toString():'N/A'}
const csvCell=value=>{const s=value==null?'N/A':String(value);return /[",\r\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s};
export function reportCsv(report,kind){
 const state=report.complete?'complete':'partial';
 const rows=kind==='frames'?
  [['frame','frame_status','sequence_status',...report.columns.map(c=>`${c.id} [${c.unit}]`),'excluded_reason'],...report.rows.map(r=>[r.frame,r.reason?'scoring blocked':r.calculated?'calculated':'not calculated',state,...report.columns.map(c=>r.values[c.id]),r.reason||''])]:
  [['metric','unit','mean','minimum','maximum','valid_frames','excluded_frames','total_frames','sequence_status','median','p95','stddev'],...report.summary.map(s=>[s.id,s.unit,s.mean,s.minimum,s.maximum,s.valid,s.excluded,s.total,state,s.median,s.p95,s.stddev])];
 if(kind==='frames'){rows[0].push('split','prediction_type','prediction_origin_frame','fps','horizon_seconds');rows.slice(1).forEach((row,i)=>row.push(report.rows[i].split||'unassigned',report.rows[i].predictionType||'unassigned',report.rows[i].predictionOriginFrame,report.rows[i].fps,report.rows[i].horizonSeconds));}
 if(kind==='frames'){
  rows[0].push('algorithm_version','elevation_valid_columns','elevation_gt_valid_columns','elevation_candidate_columns','elevation_reason','elevation_excluded_reasons');
  rows.slice(1).forEach((row,i)=>{const r=report.rows[i],h=r.elevationAudit;row.push(r.algorithmVersion,h?.validColumns,h?.gtValidColumns,h?.candidateColumns,h?.reason||(h?'':'Not calculated by this result version'),JSON.stringify(h?.excludedReasons??{}));});
 }
 rows[0].push('frame_subset');rows.slice(1).forEach(row=>row.push(report.frameSubset||'all'));
 rows[0].push('sdf_error_region','geometry_region');
 rows.slice(1).forEach(row=>row.push(report.evaluationRegion||'full_domain','full_domain'));
 rows[0].push('gt_validation_mode','prediction_validation_mode','gt_override_reason','prediction_override_reason');
 rows.slice(1).forEach(row=>row.push(report.sdfValidation?.gt?.validationMode||'legacy undeclared',report.sdfValidation?.prediction?.validationMode||'legacy undeclared',report.sdfValidation?.gt?.overrideReason||'',report.sdfValidation?.prediction?.overrideReason||''));
 return rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
export function chartPoints(rows,id,width=640){
 const valid=rows.filter(r=>Number.isFinite(r.values[id]));const values=valid.map(r=>r.values[id]);
 let min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):1;
 if(min===max){const pad=Math.max(Math.abs(min)*.05,1e-6);min-=pad;max+=pad;}
 const start=rows[0]?.frame??0,end=rows.at(-1)?.frame??start;
 const x=f=>end===start?(width+42)/2:64+(f-start)/(end-start)*(width-86);
 const y=v=>180-(v-min)/(max-min)*150;
 const segments=[],points=[];let segment=[],previous=null;
 for(const row of rows){const value=row.values[id];if(!Number.isFinite(value)||previous!==null&&row.frame!==previous+1){if(segment.length)segments.push(segment);segment=[];}if(Number.isFinite(value)){const p={frame:row.frame,value,x:x(row.frame),y:y(value)};segment.push(p);points.push(p);}previous=row.frame;}
 if(segment.length)segments.push(segment);
 return {min,max,start,end,x,y,points,segments};
}
