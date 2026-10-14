export function sliceValidity(slice,mask){
 if(!slice)return {valid:0,total:0,fraction:null};
 const total=slice.values.length;let valid=0;for(let i=0;i<total;i++)if((!mask||mask.values[i])&&Number.isFinite(slice.values[i]))valid++;
 return {valid,total,fraction:total?valid/total:null};
}
export function lockedErrorRange(limit,absolute){return Number.isFinite(limit)&&limit>0?(absolute?[0,limit]:[-limit,limit]):null}
