export function nextFrame({frames,current,direction=1,loop=false,status='ready'}){
  const index=frames.indexOf(current),next=index+(direction<0?-1:1);
  if(index>=0&&next>=0&&next<frames.length)return {frame:frames[next],action:'select'};
  if(status==='processing'&&direction>0)return {frame:current,action:'wait'};
  if(status==='ready'&&loop&&frames.length>1)return {frame:direction<0?frames.at(-1):frames[0],action:'select'};
  return {frame:current,action:'stop'};
}
