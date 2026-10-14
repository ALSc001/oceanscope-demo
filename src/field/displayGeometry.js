import {buildIsoMesh} from './isoMesh.js';
export function geometryKey(snapshot,settings){return JSON.stringify([snapshot.comparisonId,snapshot.frameNumber,settings.group,settings.quality,settings.component,settings.showContext,settings.vectorDensity,settings.arrowScale,settings.plane,settings.sliceIndex,settings.previewOnly])}
export function buildDisplayGeometry(snapshot,lattice,settings){
  const layers=[],warnings=[];const groups=snapshot.data.groups;
  if(!lattice?.axisSteps)return {key:geometryKey(snapshot,settings),layers,byteLength:0,warnings:['Canonical lattice transform is unavailable']};
  const world=p=>lattice.origin.map((v,k)=>v+p.reduce((s,c,a)=>s+c*lattice.axisSteps[a][k],0));
  for(const [role,root] of [['gt','ground_truth'],['prediction','prediction']]){
    if(settings.previewOnly&&role==='prediction')continue;
    const outlineShape=(groups.sdf?.[root]||groups.velocity?.[`${root}.x`])?.shape;
    if(outlineShape&&['xy','xz','yz'].includes(settings.plane)){
      const shape=outlineShape;
      const axis=settings.plane==='xy'?2:settings.plane==='yz'?0:1,axes=[0,1,2].filter(a=>a!==axis),index=Math.max(0,Math.min(shape[axis]-1,settings.sliceIndex||0));
      const corners=[[0,0],[1,0],[1,1],[0,1]].map(q=>{const p=[0,0,0];p[axis]=index;axes.forEach((a,k)=>p[a]=q[k]*(shape[a]-1));return world(p)});
      layers.push({role,kind:'slice-outline',positions:new Float32Array([0,1,1,2,2,3,3,0].flatMap(i=>corners[i]))});
    }
    if(settings.group==='sdf'||settings.showContext){const field=groups.sdf?.[root];if(field){const {positions}=buildIsoMesh(field,lattice,settings.quality==='fine'?1:2);layers.push({role,kind:'surface',positions});if(!positions.length)warnings.push(`${role==='gt'?'Ground Truth':'Prediction'}: No zero surface found at this preview quality. Try Fine or inspect slices.`)}}
    if(settings.group!=='velocity')continue;
    const fields=['x','y','z'].map(axis=>groups.velocity?.[`${root}.${axis}`]);if(fields.some(f=>!f))continue;
    const [nx,ny,nz]=fields[0].shape,total=nx*ny*nz,positions=[],values=[],slicePositions=[],sliceValues=[];
    const density=Math.max(1,Math.min(20000,Math.floor(settings.vectorDensity||2000))),step=Math.max(1,Math.ceil(total/density));
    const scale=Number.isFinite(settings.arrowScale)&&settings.arrowScale>0?settings.arrowScale:1;
    const component=['x','y','z'].indexOf(settings.component);
    const sample=i=>fields.every(f=>Number.isFinite(f.values[i])&&(!f.mask||f.mask.values[i]));
    const value=i=>component<0?Math.hypot(...fields.map(f=>f.values[i])):fields[component].values[i];
    for(let i=0;i<total;i+=step){
      if(!sample(i))continue;const p=world([i%nx,Math.floor(i/nx)%ny,Math.floor(i/(nx*ny))]),v=fields.map(f=>f.values[i]*scale),length=Math.hypot(...v);if(length===0)continue;
      const end=p.map((x,k)=>x+v[k]),d=v.map(x=>x/length),basis=Math.abs(d[1])<.9?[0,1,0]:[1,0,0];
      const cross=[d[1]*basis[2]-d[2]*basis[1],d[2]*basis[0]-d[0]*basis[2],d[0]*basis[1]-d[1]*basis[0]],norm=Math.hypot(...cross);
      const head=Math.min(length*.22,Math.hypot(...lattice.axisSteps[0])*2),a=end.map((x,k)=>x-head*d[k]+head*.4*cross[k]/norm),b=end.map((x,k)=>x-head*d[k]-head*.4*cross[k]/norm);
      positions.push(...p,...end,...end,...a,...end,...b);for(let j=0;j<6;j++)values.push(value(i));
    }
    layers.push({role,kind:'vectors',positions:new Float32Array(positions),values:new Float32Array(values)});
    const axis=settings.plane==='xy'?2:settings.plane==='yz'?0:1,shape=[nx,ny,nz],slice=Math.max(0,Math.min(shape[axis]-1,settings.sliceIndex||0)),axes=[0,1,2].filter(k=>k!==axis);
    const stride=settings.quality==='fine'?1:2;
    for(let b=0;b<shape[axes[1]]-1;b+=stride)for(let a=0;a<shape[axes[0]]-1;a+=stride){
      const corners=[[a,b],[Math.min(a+stride,shape[axes[0]]-1),b],[Math.min(a+stride,shape[axes[0]]-1),Math.min(b+stride,shape[axes[1]]-1)],[a,Math.min(b+stride,shape[axes[1]]-1)]].map(q=>{const p=[0,0,0];p[axis]=slice;p[axes[0]]=q[0];p[axes[1]]=q[1];return p});
      const ids=corners.map(p=>p[0]+nx*(p[1]+ny*p[2]));if(!ids.every(sample))continue;
      let valid=true;for(let v=b;v<=Math.min(b+stride,shape[axes[1]]-1)&&valid;v++)for(let u=a;u<=Math.min(a+stride,shape[axes[0]]-1);u++){const p=[0,0,0];p[axis]=slice;p[axes[0]]=u;p[axes[1]]=v;if(!sample(p[0]+nx*(p[1]+ny*p[2]))){valid=false;break}}if(!valid)continue;
      for(const k of [0,1,2,0,2,3]){slicePositions.push(...world(corners[k]));sliceValues.push(value(ids[k]))}
    }
    layers.push({role,kind:'slice',positions:new Float32Array(slicePositions),values:new Float32Array(sliceValues)});
  }
  return {key:geometryKey(snapshot,settings),layers,byteLength:layers.reduce((s,l)=>s+l.positions.byteLength+(l.values?.byteLength||0),0),warnings};
}
