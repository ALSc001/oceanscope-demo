import {useI18n} from '../i18n.jsx';
import React,{useMemo,useRef,useState} from 'react';
import {sliceValidity,lockedErrorRange} from './sliceResearch.js';
import {frameMembership} from './frameMembership.js';
import {predictionType} from './predictionType.js';
import {extractSlice} from './fieldBinary.js';
import {fieldIdsForGroup,signedErrorRange,absoluteErrorRange,sliceForSource} from './fieldViewModel.js';
import SliceCanvas from './SliceCanvas.jsx';

function validRange(slices,masks){
  let minimum=Infinity,maximum=-Infinity;
  slices.forEach((slice,sliceIndex)=>{
    if(!slice)return;const mask=masks[sliceIndex];
    for(let index=0;index<slice.values.length;index+=1){
      if(mask&&!mask.values[index])continue;const value=slice.values[index];
      if(Number.isFinite(value)){minimum=Math.min(minimum,value);maximum=Math.max(maximum,value)}
    }
  });
  return Number.isFinite(minimum)?[minimum,maximum]:[0,1];
}

export default function SliceTriptych({frame,group,plane,sliceIndex,crosshair,onCrosshair,component='magnitude',fixedRange=null,lattice,single=false,label='Dataset',frameNumber,frameSplit,exportStem='comparison'}){
 const {tr,language}=useI18n(),zh=language==='zh',host=useRef(null);
 const [locked,setLocked]=useState(false),[errorLimit,setErrorLimit]=useState(1),[exportError,setExportError]=useState('');

  const sources=useMemo(()=>fieldIdsForGroup(frame,group),[frame,group]);
  const panels=useMemo(()=>['groundTruth','prediction','error'].map(key=>sliceForSource(frame,sources[key],plane,sliceIndex,component)),[frame,sources,plane,sliceIndex,component]);
  const masks=useMemo(()=>['groundTruth','prediction','error'].map(key=>sources[key]?.maskId?extractSlice(frame,sources[key].maskId,plane,sliceIndex):null),[frame,sources,plane,sliceIndex]);
  const sourceRange=fixedRange||validRange(panels.slice(0,2),masks.slice(0,2));
  const epe=group==='velocity'&&component==='magnitude';
  const errorRange=(locked&&lockedErrorRange(errorLimit,epe))||(panels[2]?(epe?absoluteErrorRange:signedErrorRange)(panels[2].values):[-1,1]);
  const titles=[single?label:'Ground Truth','Prediction',epe?'Endpoint Error |Pred − GT|':'Signed Error (Pred − GT)'];
  const axes=plane==='xy'?[0,1]:plane==='xz'?[0,2]:[1,2];
  const spacing=lattice?.voxelSize||[1,1,1];
  const counts=panels.map((s,i)=>sliceValidity(s,masks[i]));
  const axis=plane==='xy'?2:plane==='yz'?0:1;
  const origin=lattice?.origin?.map((v,k)=>v+sliceIndex*lattice.axisSteps[axis][k]);
  const metadata=`Frame ${frameNumber??'unknown'} | ${frameMembership(frameSplit,frameNumber)} | ${predictionType(frameSplit,frameNumber)} | ${group} ${component} | ${plane.toUpperCase()} index ${sliceIndex}`;
  function exportPng(){try{
   const canvases=[...host.current.querySelectorAll('canvas')],output=document.createElement('canvas');output.width=1800;output.height=920;
   const ctx=output.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1800,920);ctx.fillStyle='#18374d';ctx.font='20px sans-serif';ctx.fillText('OceanScope | '+exportStem,25,35,1740);ctx.fillText(metadata,25,70,1740);
   ctx.fillText('Plane origin (world units): '+(origin?.map(v=>v.toPrecision(5)).join(', ')||'undeclared'),25,105,1740);
   canvases.forEach((canvas,i)=>{const x=25+i*590,range=i===2?errorRange:sourceRange;ctx.fillStyle='#18374d';ctx.fillText(titles[i],x,155,560);ctx.fillText(`${range.map(v=>v.toPrecision(4)).join(' to ')} ${sources.unit||'undeclared'}`,x,185,560);
    const aspect=panels[i].width*spacing[axes[0]]/(panels[i].height*spacing[axes[1]]),w=Math.min(555,540*aspect),h=w/aspect;ctx.drawImage(canvas,x,205,w,h);
    const gradient=ctx.createLinearGradient(x,0,x+555,0);gradient.addColorStop(0,i===2?(epe?'#f6f0fc':'#205bb1'):'#ebf4fc');if(i===2&&!epe)gradient.addColorStop(.5,'#f6f8fa');gradient.addColorStop(1,i===2?(epe?'#672096':'#c94237'):'#1f6fb0');ctx.fillStyle=gradient;ctx.fillRect(x,700,555,18);ctx.fillStyle='#18374d';ctx.fillText(`${range[0].toPrecision(4)}                         ${range[1].toPrecision(4)} ${sources.unit||''}`,x,745,555);
    ctx.fillText(`Valid slice samples: ${counts[i].valid}/${counts[i].total}`,x,780,560);
   });
   ctx.fillText(`Source scale: ${fixedRange?'fixed':'auto per frame'}${single?'':` | Error scale: ${locked?'fixed':'auto per frame'}`}`,25,830,1740);
   ctx.fillText('Slice validity is not full-volume scoring coverage. Checkerboard = invalid. Source fields and scores unchanged.',25,865,1740);
   const a=document.createElement('a');a.download=`${exportStem}_${frameNumber}_${plane}_${sliceIndex}_slices.png`;a.href=output.toDataURL('image/png');a.click();setExportError('');
  }catch(e){setExportError(e.message)}}
  return <div ref={host}><div className="frame-split-toolbar">{!single&&<><label><input type="checkbox" checked={locked} onChange={e=>setLocked(e.target.checked)}/>{zh?'固定误差色标（跨帧）':'Lock error scale across frames'}</label>{locked&&<label>{zh?'误差上限':'Error limit'} <input aria-label="Error scale limit" type="number" min="0.000001" step="0.1" value={errorLimit} onChange={e=>{const n=Number(e.target.value);if(n>0&&Number.isFinite(n))setErrorLimit(n)}}/></label>}</>}<button onClick={exportPng} disabled={panels.some((p,i)=>i<(single?1:3)&&!p)}>{single?(zh?'导出切片 PNG':'Export slice PNG'):(zh?'导出并排切片 PNG':'Export slice comparison PNG')}</button></div><small>{metadata} · {zh?'有效样本比例仅针对当前切片，不等于全域计算覆盖率。':'Validity below is for this slice, not full-volume scoring coverage.'}</small>{exportError&&<p role="alert">{exportError}</p>}<section className="slice-triptych" aria-label={`${group} synchronized slices`}>
    {panels.slice(0,single?1:3).map((slice,index)=>{const probe=slice&&crosshair?Math.min(slice.width-1,Math.floor(crosshair[0]*slice.width))+slice.width*Math.min(slice.height-1,Math.floor(crosshair[1]*slice.height)):null;const valid=probe!==null&&(!masks[index]||masks[index].values[probe])&&Number.isFinite(slice.values[probe]);return <figure key={titles[index]}><figcaption><strong>{titles[index]}</strong><span>{index===2?`${errorRange[0].toPrecision(3)} … ${errorRange[1].toPrecision(3)}`:`${sourceRange[0].toPrecision(3)} … ${sourceRange[1].toPrecision(3)}`} {sources.unit||tr("(unit undeclared)")}</span></figcaption>{slice?<SliceCanvas slice={slice} maskSlice={masks[index]} range={index===2?errorRange:sourceRange} palette={index===2?(epe?'absolute-error':'error'):'ground-truth'} aspect={slice.width*spacing[axes[0]]/(slice.height*spacing[axes[1]])} {...{crosshair,onCrosshair,plane}}/>:<div className="slice-unavailable">{tr("Not available")}</div>}<small>{tr("Probe: ")}{valid?slice.values[probe].toPrecision(6):tr("Not valid")} {sources.unit} · {group==='velocity'?component:tr("SDF")}</small></figure>})}
  </section><div className="frame-split-toolbar">{counts.slice(0,single?1:3).map((c,i)=><small key={i}>{titles[i]}: {c.valid}/{c.total} · {c.fraction==null?'N/A':(100*c.fraction).toFixed(1)+'%'}</small>)}</div></div>;
}
