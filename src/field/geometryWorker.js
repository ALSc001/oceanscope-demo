import {buildDisplayGeometry} from './displayGeometry.js';
self.onmessage=({data})=>{
  if(data.version!==1||data.type!=='build')return;
  try{const result=buildDisplayGeometry(data.payload.snapshot,data.payload.lattice,data.payload.settings);const transfers=result.layers.flatMap(l=>[l.positions.buffer,...(l.values?[l.values.buffer]:[])]);self.postMessage({version:1,requestId:data.requestId,type:'result',result},transfers)}
  catch(error){self.postMessage({version:1,requestId:data.requestId,type:'error',error:error.message})}
};
