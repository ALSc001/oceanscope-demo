import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';

export function decodeMesh(buffer) {
  const h=new Uint32Array(buffer,0,4);
  if(h[0]!==0x57415645 || h[3]!==1 || buffer.byteLength!==16+h[1]*12+h[2]*12) throw Error('Invalid mesh data');
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,16,h[1]*3),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,16+h[1]*12,h[2]*3),1));
  geometry.computeBoundingBox(); geometry.computeVertexNormals();
  geometry.boundsTree=new MeshBVH(geometry);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.raycast=acceleratedRaycast;mesh.updateMatrixWorld(true);
  return {geometry,mesh};
}

export function surfaceProfile(mesh,axis,offset,count=257,range=null) {
  const box=mesh.geometry.boundingBox, a=axis==='x'?0:2, b=axis==='x'?2:0;
  const lo=range?range[0]:box.min.getComponent(a),hi=range?range[1]:box.max.getComponent(a);
  const ray=new THREE.Raycaster();ray.firstHitOnly=true;
  ray.ray.direction.set(0,-1,0);const rows=[];
  for(let i=0;i<count;i++) {
    const s=lo+(hi-lo)*i/(count-1);ray.ray.origin.set(0,box.max.y+Math.max(1,box.max.y-box.min.y),0);
    ray.ray.origin.setComponent(a,s);ray.ray.origin.setComponent(b,offset);
    const hit=ray.intersectObject(mesh,false)[0];
    rows.push([s,hit?hit.point.y:null]);
  }
  return rows;
}

export function profileMetrics(rows,reference,scale) {
  const v=rows.filter(r=>r[1]!==null&&Number.isFinite(r[1])).map(r=>(r[1]-reference)*scale);
  return v.length?{max:Math.max(...v),min:Math.min(...v),range:Math.max(...v)-Math.min(...v),valid:v.length}:{max:null,min:null,range:null,valid:0};
}

export function sectionSegments(geometry,axis,offset) {
  const k=axis==='x'?2:0,p=geometry.attributes.position.array,id=geometry.index.array,out=[];
  for(let t=0;t<id.length;t+=3){
    const verts=[id[t]*3,id[t+1]*3,id[t+2]*3],d=verts.map(v=>p[v+k]-offset);
    if(Math.min(...d)>0||Math.max(...d)<0||d.every(v=>Math.abs(v)<1e-9))continue;
    const hits=[];
    for(let a=0;a<3;a++){
      const b=(a+1)%3,va=verts[a],vb=verts[b];let q=null;
      if(Math.abs(d[a])<1e-9)q=[p[va],p[va+1],p[va+2]];
      else if(d[a]*d[b]<0){const u=d[a]/(d[a]-d[b]);q=[0,1,2].map(c=>p[va+c]+u*(p[vb+c]-p[va+c]));}
      if(q&&!hits.some(h=>h.every((v,c)=>Math.abs(v-q[c])<1e-7)))hits.push(q);
    }
    if(hits.length===2)out.push(...hits[0],...hits[1]);
  }
  return new Float32Array(out);
}

export function scientificCSV(dataset,frame,rows,reference,scale,axis,offset){
  return 'dataset,frame,time_seconds,axis,section_offset_m,position_m,surface_y_m,eta_m\n'+rows.map(([s,y])=>
    [dataset.id,frame,(frame-dataset.start)/dataset.fps,axis,offset*scale,s*scale,y===null?'':y*scale,y===null?'':(y-reference)*scale].join(',')).join('\n');
}
