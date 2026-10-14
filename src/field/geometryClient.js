import {geometryKey} from './displayGeometry.js';
export function createGeometryClient({workerFactory=()=>new Worker(new URL('./geometryWorker.js',import.meta.url),{type:'module'}),byteBudget=134217728}={}){
  const cache=new Map();let worker=null,pending=null,serial=0,disposed=false;
  const bytes=()=>[...cache.values()].reduce((s,v)=>s+v.byteLength,0);
  function cancel(){if(pending){pending.resolve(null);pending=null;worker?.terminate();worker=null}}
  return {
    request(snapshot,lattice,settings){
      if(disposed)return Promise.resolve(null);cancel();
      const key=geometryKey(snapshot,settings);if(cache.has(key)){const result=cache.get(key);cache.delete(key);cache.set(key,result);return Promise.resolve(result)}
      return new Promise((resolve,reject)=>{
        const id=++serial;pending={resolve,reject,id};
        try{
          worker??=workerFactory();
          worker.onmessage=({data})=>{if(!pending||data.requestId!==pending.id||data.version!==1)return;pending=null;if(data.type==='error'){reject(Error(data.error));return}
            const result=data.result;cache.set(key,result);for(const k of cache.keys()){if(bytes()<=byteBudget)break;if(k!==key)cache.delete(k)}resolve(result);
          };
          worker.onerror=event=>{if(pending?.id===id){pending=null;worker?.terminate();worker=null;reject(Error(event.message||'Geometry worker failed'))}};
          // Structured cloning copies only selected field arrays, leaving slice/probe buffers intact.
          const copies=new Map(),transfers=[];
          const compact=field=>{if(!field)return null;if(copies.has(field))return copies.get(field);const values=field.values.slice(),copy={...field,values,mask:null};copies.set(field,copy);transfers.push(values.buffer);copy.mask=compact(field.mask);return copy};
          const groups=Object.fromEntries(Object.entries(snapshot.data.groups).filter(([k])=>k===settings.group||(k==='sdf'&&settings.showContext)).map(([k,g])=>[k,Object.fromEntries(Object.entries(g).filter(([name])=>(name==='ground_truth'||name==='prediction'||/^(ground_truth|prediction)\.[xyz]$/.test(name))&&(!settings.previewOnly||!name.startsWith('prediction'))).map(([name,field])=>[name,compact(field)]))]));
          worker.postMessage({version:1,requestId:id,comparisonId:snapshot.comparisonId,type:'build',payload:{snapshot:{...snapshot,data:{groups}},lattice,settings}},transfers);
        }catch(error){pending=null;reject(error)}
      });
    },
    stats(){return {bytes:bytes(),cachedFrames:cache.size,oversize:bytes()>byteBudget}},
    dispose(){disposed=true;cancel();worker?.terminate();worker=null;cache.clear()},
  };
}
