// Display-only marching tetrahedra; scores are computed independently by the native helper.
const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
export function buildIsoMesh(field,lattice,stride=1){
  if(!field||!lattice)return {positions:new Float32Array()};
  const [nx,ny,nz]=field.shape,positions=[];
  const world=p=>lattice.origin.map((v,k)=>v+p.reduce((s,c,a)=>s+c*lattice.axisSteps[a][k],0));
  const emit=(a,b,c)=>positions.push(...world(a),...world(b),...world(c));
  stride=Math.max(1,Math.floor(stride));
  for(let z=0;z<nz-1;z+=stride)for(let y=0;y<ny-1;y+=stride)for(let x=0;x<nx-1;x+=stride){
    const dx=Math.min(stride,nx-1-x),dy=Math.min(stride,ny-1-y),dz=Math.min(stride,nz-1-z);
    let invalid=false;
    if(stride>1)for(let c=0;c<=dz&&!invalid;c++)for(let b=0;b<=dy&&!invalid;b++)for(let a=0;a<=dx;a++){
      const i=x+a+nx*(y+b+ny*(z+c));if(!Number.isFinite(field.values[i])||(field.mask&&!field.mask.values[i])){invalid=true;break}
    }
    if(invalid)continue;
    const points=corners.map(([a,b,c])=>[x+a*dx,y+b*dy,z+c*dz]);
    const ids=points.map(([a,b,c])=>a+nx*(b+ny*c));
    if(ids.some(i=>!Number.isFinite(field.values[i])||(field.mask&&!field.mask.values[i])))continue;
    const values=ids.map(i=>field.values[i]);
    if(values.every(v=>v>=0)||values.every(v=>v<0))continue;
    const edge=(a,b)=>{const t=values[a]/(values[a]-values[b]);return points[a].map((v,k)=>v+t*(points[b][k]-v))};
    for(const tetra of tetrahedra){
      const inside=tetra.filter(i=>values[i]<0),outside=tetra.filter(i=>values[i]>=0);
      if(inside.length===1)emit(...outside.map(i=>edge(inside[0],i)));
      else if(inside.length===3)emit(...inside.map(i=>edge(outside[0],i)).reverse());
      else if(inside.length===2){
        const a=edge(inside[0],outside[0]),b=edge(inside[0],outside[1]);
        const c=edge(inside[1],outside[0]),d=edge(inside[1],outside[1]);
        emit(a,b,c);emit(b,d,c);
      }
    }
  }
  return {positions:new Float32Array(positions)};
}
