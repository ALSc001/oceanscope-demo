/** Owns decoded frames, not renderer resources. Superseded selections return null. */
export function createFrameController({fetchFrame,decode,byteBudget=268435456,maxFrames=5}){
  const cache=new Map(),pending=new Map();let active=null,generation=0,disposed=false,scrubbing=false;
  const key=(id,n)=>`${id}:${n}`;
  const bytes=()=>[...cache.values()].reduce((sum,v)=>sum+v.byteLength,0);
  function trim(){for(const k of cache.keys()){if(cache.size<=maxFrames&&bytes()<=byteBudget)break;if(k!==active)cache.delete(k)}}
  function load(id,n){
    const k=key(id,n);
    if(cache.has(k)){const value=cache.get(k);cache.delete(k);cache.set(k,value);return Promise.resolve(value)}
    if(pending.has(k))return pending.get(k).promise;
    const controller=new AbortController();
    const promise=fetchFrame(id,n,{signal:controller.signal}).then(buffer=>{
      if(disposed||controller.signal.aborted)return null;
      const data=decode(buffer),buffers=new Set(data.fields.map(f=>f.values.buffer));
      const result={comparisonId:id,frameNumber:n,data,byteLength:[...buffers].reduce((s,b)=>s+b.byteLength,0)};
      cache.set(k,result);trim();return result;
    }).finally(()=>{if(pending.get(k)?.controller===controller)pending.delete(k)});
    pending.set(k,{promise,controller});return promise;
  }
  return {
    async select(id,n){
      if(disposed)return null;
      const ticket=++generation,k=key(id,n);
      for(const [other,p] of pending)if(other!==k){p.controller.abort();pending.delete(other)}
      const previous=active;active=k;
      try{const result=await load(id,n);if(disposed||ticket!==generation)return null;trim();return result}
      catch(error){if(disposed||ticket!==generation||error.name==='AbortError')return null;active=previous;throw error}
    },
    async prefetch(id,frames){if(disposed||scrubbing)return;await Promise.all(frames.slice(0,2).map(n=>load(id,n).catch(()=>null)))},
    setScrubbing(value){scrubbing=value;if(value)for(const [k,p] of pending)if(k!==active){p.controller.abort();pending.delete(k)}},
    stats(){return {bytes:bytes(),cachedFrames:cache.size,oversize:bytes()>byteBudget}},
    dispose(){disposed=true;generation++;for(const p of pending.values())p.controller.abort();pending.clear();cache.clear()},
  };
}
