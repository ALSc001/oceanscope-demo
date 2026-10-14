import {useI18n} from '../i18n.jsx';
import React,{useEffect,useState,useRef,useMemo} from 'react';
import {readSession,writeSession} from '../session.js';
import MeshView from '../MeshView.jsx';
import ProfileChart,{COLORS} from '../ProfileChart.jsx';
import {decodeMesh,surfaceProfile,profileMetrics,scientificCSV} from '../analysis.js';

const cache=new Map();
async function loadMesh(ds,frame){
 const key=ds.id+':'+frame;if(cache.has(key))return cache.get(key);
 const response=await fetch('data/'+ds.mesh_pattern.replace('{frame}',frame));if(!response.ok)throw Error('Mesh unavailable: '+frame);
 let buffer=await response.arrayBuffer();const magic=new Uint8Array(buffer,0,2);
 if(magic[0]===31&&magic[1]===139)buffer=await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const resource=decodeMesh(buffer);cache.set(key,resource);
 while(cache.size>6){const [old,r]=cache.entries().next().value;cache.delete(old);r.geometry.dispose();r.mesh.material.dispose();}
 return resource;
}
function download(name,body,type='text/csv'){const blob=new Blob([body],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
const fmt=v=>v===null||v===undefined?'—':v.toFixed(3);
function Numeric({label,value,onChange,min,max,step=.01}){
 const {tr}=useI18n();
return <label className="control"><span>{tr(label)}</span><input type="number" value={value} min={min} max={max} step={step} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&e.target.value!==''&&(min===undefined||n>=min)&&(max===undefined||n<=max))onChange(n);}}/></label>}
export default function SurfaceWorkspace({active=true}){
 const {tr,language}=useI18n();const zh=language==='zh';
 const [speed,setSpeed]=useState(1),[loop,setLoop]=useState(false);
 useEffect(()=>{if(!active)setPlaying(false)},[active]);
 const [showHighestMarker,setShowHighestMarker]=useState(true);
 const [manifest,setManifest]=useState(null),[id,setId]=useState('gentle'),[frame,setFrame]=useState(1048),[axis,setAxis]=useState('x'),[offset,setOffset]=useState(.3),[reference,setReference]=useState(0),[scale,setScale]=useState(1),[colorMin,setColorMin]=useState(-.25),[colorMax,setColorMax]=useState(1),[wireframe,setWireframe]=useState(false),[showSection,setShowSection]=useState(true),[compare,setCompare]=useState(true),[profiles,setProfiles]=useState({}),[resource,setResource]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[playing,setPlaying]=useState(false);
 useEffect(()=>{if(manifest&&!manifest.datasets.some(d=>d.id===id)){const next=manifest.datasets[0];setPlaying(false);setId(next?.id||'');setFrame(next?.start||1001);setResource(null);setProfiles({});setBusy(false)}},[manifest,id]);
 const latest=useRef(0);
 const [viewRestored,setViewRestored]=useState(false);
 useEffect(()=>{const saved=readSession('wave');if(saved){if(typeof saved.id==='string')setId(saved.id);if(Number.isInteger(saved.frame))setFrame(saved.frame);if(['x','z'].includes(saved.axis))setAxis(saved.axis);if(Number.isFinite(saved.offset))setOffset(saved.offset);if(Number.isFinite(saved.reference))setReference(saved.reference);if(saved.scale>0)setScale(saved.scale);setWireframe(Boolean(saved.wireframe));setShowSection(saved.showSection!==false);setShowHighestMarker(saved.showHighestMarker!==false)}setViewRestored(true)},[]);
 useEffect(()=>{if(viewRestored&&ds)writeSession('wave',{id,frame,axis,offset,reference,scale,wireframe,showSection,showHighestMarker})},[viewRestored,id,frame,axis,offset,reference,scale,wireframe,showSection,showHighestMarker]);
 const ds=manifest?.datasets.find(d=>d.id===id),row=ds?.frames.find(r=>r.frame===frame),metrics=profileMetrics(profiles[id]||[],reference,scale);
 const samples=ds?.sample_frames||[];
 useEffect(()=>{if(samples.length&&!samples.includes(frame))setFrame(samples.reduce((a,b)=>Math.abs(a-frame)<Math.abs(b-frame)?a:b))},[ds,frame]);
 async function refresh(){const r=await fetch('data/manifest.json');if(!r.ok)throw Error('Dataset manifest unavailable');setManifest(await r.json());}
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[]);
 useEffect(()=>{
  const token=++latest.current;if(!ds||!ds.sample_frames.includes(frame))return;setBusy(true);setError('');
  const active=compare?manifest.datasets.filter(d=>frame>=d.start&&frame<=d.end):[ds];
  Promise.all(active.map(async d=>[d,await loadMesh(d,frame)])).then(items=>{
    if(token!==latest.current)return;
    const selected=items.find(([d])=>d.id===id)?.[1];if(!selected)return;
    const b=selected.geometry.boundingBox,k=axis==='x'?'x':'z';const range=ds.profile_bounds?.[axis]||manifest.profile_bounds?.[axis]||[b.min[k],b.max[k]];
    const result={};for(const [d,r] of items)result[d.id]=surfaceProfile(r.mesh,axis,offset,257,range);
    setResource(selected);setProfiles(result);setBusy(false);
  }).catch(e=>{if(token===latest.current){setError(e.message);setResource(null);setProfiles({});setBusy(false);setPlaying(false)}});
 },[ds,frame,axis,offset,compare,manifest]);
 useEffect(()=>{if(!playing||!ds||busy)return;const timer=setTimeout(()=>{const i=samples.indexOf(frame);if(i>=samples.length-1){if(loop)setFrame(samples[0]);else setPlaying(false)}else setFrame(samples[i+1])},450/speed);return()=>clearTimeout(timer)},[playing,ds,busy,frame,speed,loop]);
 function exportCSV(){if(!ds)return;download(`${id}_${frame}_${axis}_profile.csv`,scientificCSV(ds,frame,profiles[id]||[],reference,scale,axis,offset));}
 function exportSeries(){if(!ds)return;download(`${id}_maximum_elevation.csv`,'dataset,frame,time_seconds,max_elevation_m,highest_world_y_m,peak_x_m,peak_y_m,peak_z_m,reference_y_hu,meters_per_unit\n'+ds.frames.map(r=>[id,r.frame,(r.frame-ds.start)/ds.fps,(r.max_y-reference)*scale,r.max_y*scale,...r.max_position.map(x=>x*scale),reference,scale].join(',')).join('\n'));}
 const offsetBounds=resource?resource.geometry.boundingBox:null;
 const offsetMin=offsetBounds?(axis==='x'?offsetBounds.min.z:offsetBounds.min.x):-3,offsetMax=offsetBounds?(axis==='x'?offsetBounds.max.z:offsetBounds.max.x):4;
 return <div className="app">
 <header><h1>{tr('Wave Surface')} <span>— Calm / Gentle / Strong</span></h1><div className="header-actions"><button className="primary" disabled={!ds||!resource||busy} onClick={exportCSV}>{tr("↓ Export CSV")}</button></div></header>
 <div className="demo-sampling">{zh?`每种海况 ${samples.length} 个原始三维帧 · 含连续帧 1048–1055 · 可导出完整 240 帧最高水位序列`:`${samples.length} original mesh frames per sea state · Consecutive frames 1048–1055 · Complete 240-frame maximum-elevation CSV`}</div>
 {error&&<div className="error" role="alert">{tr(error)}</div>}
 <div className="workspace"><aside className="settings">
 <section><h2>{tr("Dataset")}</h2>{manifest?.datasets.map(d=><label className="radio" key={d.id}><input type="radio" name="dataset" checked={id===d.id} onChange={()=>{setPlaying(false);setId(d.id)}}/>{d.name}</label>)}</section>
 <section><h2>{tr("Cross section")}</h2><div className="row">{['x','z'].map(a=><label className="radio" key={a}><input type="radio" checked={axis===a} onChange={()=>{setAxis(a);setOffset(a==='x'?.3:-4.1)}}/>{tr("Along ")}{a.toUpperCase()}</label>)}</div>
 <Numeric label={`Position (${axis==='x'?'Z':'X'}, HU)`} value={offset} onChange={setOffset}/><input aria-label={tr("Section position slider")} type="range" min={offsetMin} max={offsetMax} step=".01" value={offset} onChange={e=>setOffset(+e.target.value)}/>
 <Numeric label={tr("Reference level (HU)")} value={reference} onChange={setReference}/><Numeric label={tr("Meters per unit")} min={.000001} value={scale} onChange={setScale}/>
 <span className="field-label">{tr("Color range (m)")}</span><div className="row"><input aria-label={tr("Color minimum")} type="number" step=".05" value={colorMin} onChange={e=>{const v=Number(e.target.value);if(v<colorMax)setColorMin(v)}}/><input aria-label={tr("Color maximum")} type="number" step=".05" value={colorMax} onChange={e=>{const v=Number(e.target.value);if(v>colorMin)setColorMax(v)}}/></div>
 <label className="check"><input type="checkbox" checked={showSection} onChange={e=>setShowSection(e.target.checked)}/>{tr("Show section")}</label><label className="check"><input type="checkbox" checked={wireframe} onChange={e=>setWireframe(e.target.checked)}/>{tr("Wireframe")}</label></section>
 <section><label className="check"><input type="checkbox" checked={showHighestMarker} onChange={e=>setShowHighestMarker(e.target.checked)}/>{tr("Show highest-point marker")}</label><small>{tr("Orange dot: highest vertex of the displayed mesh, not a water droplet. Display only; does not change measurements.")}</small></section>
 <section><label className="check compare"><span>{tr("Compare profiles")}</span><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/></label></section>
 <section><h2>{tr("Cached parameters")}</h2><table><tbody>{[['Wind speed','windspeed'],['Amplitude scale','ampscale'],['Swell','swell'],['Chop','chopscale'],['Simulation time scale','timescale'],['Wave count','nwaves'],['Wave separation','wavesep'],['Wave speed','wavespeed'],['Wave amplitude','pointamp'],['Wave chop','pointwavechop'],['Min substeps','minsubsteps'],['Max substeps','maxsubsteps'],['Whitewater emission','whitewater_emission']].map(([label,key])=><tr key={key}><td>{tr(label)}</td><td>{ds?.parameters?.[key]??'—'}</td></tr>)}</tbody></table></section>
 </aside>
 <main><section className="surface-panel"><h2>{tr("3D water surface")}</h2><MeshView datasetKey={id} {...{resource,axis,offset,reference,scale,colorMin,colorMax,wireframe,showSection,showHighestMarker}}/>{busy&&<div className="loading">{tr("Loading measured geometry…")}</div>}</section>
 <section className="profile-panel"><div className="panel-title"><h2>{tr("Surface profile")}</h2><div className="legend">{Object.keys(profiles).map(k=><span key={k}><i style={{background:COLORS[k]||'#008ca0'}}/>{manifest?.datasets.find(d=>d.id===k)?.name||k}</span>)}</div></div><ProfileChart {...{profiles,axis,reference,scale}}/></section></main>
 <aside className="measurements"><h2>{tr("Current frame")}</h2><div className="metric major"><span>{tr("Maximum elevation")}</span><strong>{fmt(row&&resource&&!busy?(row.max_y-reference)*scale:null)} <small>{tr("m")}</small></strong><p>{tr("Main connected water body; excludes detached spray.")}</p></div>
 {[['Section maximum',metrics.max],['Section minimum',metrics.min],['Section range',metrics.range]].map(([title,value])=><div className="metric" key={title}><span>{tr(title)}</span><strong>{fmt(busy?null:value)} <small>{tr("m")}</small></strong></div>)}
 <p>{tr("Section range is not Hs.")}</p><p>{metrics.valid}{tr(" / 257 valid samples")}</p><button className="series-button" disabled={!ds} onClick={exportSeries}>{tr("Export maximum time series")}</button><details><summary>{tr("Measurement definitions")}</summary><p>{tr("η = (Y − reference Y) × meters per unit. Profiles use the uppermost mesh intersection. True sections include underwater walls and the bottom; these are excluded from profile statistics.")}</p><p>{tr("1 HU = 1 m is the declared simulation scale, not field calibration. Historical Calm / Gentle / Strong time scales differ.")}</p><p>{tr("No wave-pair detection or significant wave height is computed.")}</p></details></aside></div>
 <footer><div className="timeline"><button className="sample-step" aria-label={tr('Previous frame')} disabled={!samples.length||frame===samples[0]} onClick={()=>{setPlaying(false);setFrame(samples[Math.max(0,samples.indexOf(frame)-1)])}}>‹</button><button className="play" aria-label={playing?'Pause':'Play'} disabled={!ds} onClick={()=>{if(frame===samples.at(-1))setFrame(samples[0]);setPlaying(!playing)}}>{playing?'Ⅱ':'▶'}</button><button className="sample-step" aria-label={tr('Next frame')} disabled={!samples.length||frame===samples.at(-1)} onClick={()=>{setPlaying(false);setFrame(samples[Math.min(samples.length-1,samples.indexOf(frame)+1)])}}>›</button><input aria-label="Sample frame slider" type="range" min="0" max={Math.max(0,samples.length-1)} step="1" value={Math.max(0,samples.indexOf(frame))} onChange={e=>{setPlaying(false);setFrame(samples[+e.target.value])}}/><label>Frame <select aria-label="Sample frame" value={frame} onChange={e=>{setPlaying(false);setFrame(+e.target.value)}}>{samples.map(f=><option key={f} value={f}>{f}</option>)}</select> / {ds?.end||1240}</label><label>{tr('Speed')} <select aria-label={tr('Speed')} value={speed} onChange={e=>setSpeed(+e.target.value)}>{[.5,1,2].map(v=><option key={v} value={v}>{v}×</option>)}</select></label><label><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/>{tr('Loop')}</label><span>{zh?'采样帧播放':'Sampled playback'}</span><span>Time {ds?((frame-ds.start)/ds.fps).toFixed(2):'0.00'} s</span></div><div className="footnote">Y up · Frame {ds?.start||1001} = 0 s · 1 unit = {scale} m (declared scale) · Original mesh resolution</div></footer>
 </div>;
}
