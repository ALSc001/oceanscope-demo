export function describe(input){
 const values=input.filter(v=>typeof v==='number'&&Number.isFinite(v)).sort((a,b)=>a-b);
 if(!values.length)return {median:null,p95:null,stddev:null};
 const quantile=q=>{const at=(values.length-1)*q,lo=Math.floor(at),f=at-lo;return values[lo]*(1-f)+values[Math.min(lo+1,values.length-1)]*f;};
 const scale=values.reduce((m,v)=>Math.max(m,Math.abs(v)),0),normalized=values.map(v=>scale?v/scale:0);
 const center=normalized.reduce((s,v)=>s+v/values.length,0);
 const stddev=Math.sqrt(normalized.reduce((s,v)=>s+(v-center)**2/values.length,0))*scale;
 return {median:quantile(.5),p95:quantile(.95),stddev:Number.isFinite(stddev)?stddev:null};
}
