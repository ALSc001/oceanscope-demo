let manifestPromise;
export function loadPublicCases(){
  if(!manifestPromise) manifestPromise=fetch('data/field-demo.json').then(r=>{if(!r.ok)throw Error(`Sample manifest unavailable (${r.status})`);return r.json()}).then(data=>{if(!data.cases?.length)throw Error('No published examples available');return data}).catch(e=>{manifestPromise=null;throw e});
  return manifestPromise;
}
export function downloadPublicFile(name,body,type='application/json'){
  const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const csvCell=v=>v==null?'':`"${String(v).replaceAll('"','""')}"`;
export function metricCSV(item){
  const rows=[['case','frame','field','metric','value','declared_field_unit','evaluation_region']];
  for(const [frame,groups] of Object.entries(item.metrics?.frames||{}))for(const [group,metrics] of Object.entries(groups)){
    if(metrics.blocked)continue;
    for(const [key,value] of Object.entries(metrics))if(typeof value==='number'||value===null)rows.push([item.id,frame,group,key,value,item.comparison.settings?.[group]?.gt?.unit||'undeclared',metrics.evaluationRegion||'']);
  }
  return rows.map(row=>row.map(csvCell).join(',')).join('\n');
}
