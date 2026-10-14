// Local preferences only: never store field arrays or metric payloads.
export function readSession(key,fallback=null){try{const data=JSON.parse(localStorage.getItem(`oceanscope.session.v1.${key}`));return data&&typeof data==='object'&&!Array.isArray(data)?data:fallback}catch{return fallback}}
export function writeSession(key,value){try{localStorage.setItem(`oceanscope.session.v1.${key}`,JSON.stringify(value));return true}catch{return false}}
export async function restoreDataset(saved){
 if(!saved?.id||!saved.fingerprint)return {unchanged:false,reason:'No verified session record. Inspect VDB again.'};
 const response=await fetch('/api/v1/field/restore-dataset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({datasetId:saved.id,fingerprint:saved.fingerprint})});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to validate saved dataset');return result;
}
