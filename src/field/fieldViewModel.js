import {extractSlice} from './fieldBinary.js';

const SOURCE_NAMES={groundTruth:'ground_truth',prediction:'prediction',error:'error'};

export function physicalSlicePosition(lattice,plane,index){
  if(!lattice?.origin||!lattice?.axisSteps)throw new Error('Canonical lattice transform is unavailable');
  const axis=plane==='yz'?0:plane==='xz'?1:plane==='xy'?2:-1;
  if(axis<0)throw new Error(`Unknown slice plane ${plane}`);
  return lattice.origin.map((value,component)=>value+lattice.axisSteps[axis][component]*index);
}

function finiteValues(field){
  if(!field)return [];
  const values=[];
  for(let index=0;index<field.values.length;index+=1){
    if(field.mask&&!field.mask.values[index])continue;
    const value=field.values[index];
    if(Number.isFinite(value))values.push(value);
  }
  return values;
}

export function rangeForSources(...fields){
  const values=fields.flatMap(finiteValues);
  if(!values.length)return [0,1];
  return [Math.min(...values),Math.max(...values)];
}

export function signedErrorRange(values){
  let magnitude=0;
  for(const value of values)if(Number.isFinite(value))magnitude=Math.max(magnitude,Math.abs(value));
  return [-magnitude,magnitude];
}

export function absoluteErrorRange(values){
  let maximum=0;
  for(const value of values)if(Number.isFinite(value))maximum=Math.max(maximum,Math.abs(value));
  return [0,maximum];
}

function sourceDescriptor(group,source){
  const root=SOURCE_NAMES[source];
  if(!group)return null;
  if(group[root])return {ids:[group[root].id],maskId:group[root].mask?.id||null};
  const components=['x','y','z'].map(axis=>group[`${root}.${axis}`]).filter(Boolean);
  if(components.length!==3)return null;
  return {ids:components.map(field=>field.id),maskId:components[0].mask?.id||null};
}

export function fieldIdsForGroup(frame,kind){
  const group=frame?.groups?.[kind];
  const groundTruth=sourceDescriptor(group,'groundTruth');
  const prediction=sourceDescriptor(group,'prediction');
  const error=sourceDescriptor(group,'error');
  const firstId=groundTruth?.ids?.[0]||prediction?.ids?.[0]||error?.ids?.[0];
  const unit=firstId?(frame.fields?.find(field=>field.id===firstId)?.unit
    ||Object.values(group||{}).find(field=>field?.id===firstId)?.unit||''):'';
  return {kind,groundTruth,prediction,error,unit};
}

export function sliceForSource(frame,source,plane,sliceIndex,component='magnitude'){
  if(!source?.ids?.length)return null;
  if(source.ids.length===1)return {...extractSlice(frame,source.ids[0],plane,sliceIndex),components:null};
  const components=source.ids.map(id=>extractSlice(frame,id,plane,sliceIndex));
  const axis=['x','y','z'].indexOf(component);
  if(axis>=0)return {...components[axis],components:null};
  const values=new Float32Array(components[0].values.length);
  for(let index=0;index<values.length;index+=1){
    values[index]=Math.hypot(components[0].values[index],components[1].values[index],components[2].values[index]);
  }
  return {...components[0],fieldId:source.ids.join('+'),values,components:components.map(item=>item.values)};
}

export function buildTimeline(frames,valuesByFrame={}){
  if(!frames.length)return [];
  const present=new Set(frames);
  const result=[];
  for(let frame=Math.min(...frames);frame<=Math.max(...frames);frame+=1){
    const missing=!present.has(frame);
    const raw=missing?null:valuesByFrame[frame];
    result.push({frame,value:Number.isFinite(raw)?raw:null,missing});
  }
  return result;
}

export function maximumSliceIndex(field,plane){
  if(!field)return 0;
  if(plane==='yz')return field.shape[0]-1;
  if(plane==='xz')return field.shape[1]-1;
  if(plane==='xy')return field.shape[2]-1;
  throw new Error(`Unknown slice plane ${plane}`);
}
