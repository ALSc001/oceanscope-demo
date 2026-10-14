import {useI18n} from '../i18n.jsx';
import React,{useEffect,useMemo,useRef,useState,useCallback} from 'react';
import {createFrameController} from './frameController.js';import {createGeometryClient} from './geometryClient.js';
import {decodeFieldFrame} from './fieldBinary.js';import {loadFieldFrame,loadFieldMetrics} from './fieldApi.js';
import {fieldIdsForGroup,maximumSliceIndex,physicalSlicePosition} from './fieldViewModel.js';
import FieldViewport from './FieldViewport.jsx';import FieldTimeline from './FieldTimeline.jsx';import SliceTriptych from './SliceTriptych.jsx';
import MetricsPanel from './MetricsPanel.jsx';import SequenceMetrics from './SequenceMetrics.jsx';import LossDefinitions from './LossDefinitions.jsx';import AlignmentReport from './AlignmentReport.jsx';
import {resultExportStem} from '../results/resultNames.js';
import {readSession,writeSession} from '../session.js';

function download(name,value,type='application/json'){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function worldBounds(lattice){if(!lattice?.dimensions||!lattice.axisSteps)return null;const points=[];for(let i=0;i<8;i++)points.push(lattice.origin.map((v,k)=>v+lattice.dimensions.reduce((s,n,a)=>s+((i>>a)&1)*(n-1)*lattice.axisSteps[a][k],0)));return {min:[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))),max:[0,1,2].map(k=>Math.max(...points.map(p=>p[k])))}}
export default function ComparisonWorkbench({comparison,processing,activeGroup,onActiveGroup,setup,expectedFrames,metricsOverride,frameSplit=comparison.frameSplit,readOnly=false,active=true}){
 const {tr}=useI18n();

  const setupDetails=useRef(null);
  const exportStem=resultExportStem(comparison);
  function reviewSetup(){if(setupDetails.current){setupDetails.current.open=true;setupDetails.current.scrollIntoView?.({block:'start'});}}
  const latticeKey=JSON.stringify(processing?.lattice??null),lattice=useMemo(()=>JSON.parse(latticeKey),[latticeKey]);
  const frames=useMemo(()=>processing?.frames?.map(f=>f.frame)||[],[processing?.frames]);
  const [requested,setRequested]=useState(null),[displayed,setDisplayed]=useState(null),[metrics,setMetrics]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [mode,setMode]=useState(()=>{const v=readOnly?'split':readSession('field-view')?.mode;return ['split','overlay','wire-overlay','gt','prediction'].includes(v)?v:'split'}),[quality,setQuality]=useState('balanced'),[component,setComponent]=useState('magnitude'),[opacity,setOpacity]=useState(.65),[context,setContext]=useState(false),[density,setDensity]=useState(2000),[arrowScale,setArrowScale]=useState(1);
  const [plane,setPlane]=useState('xz'),[slice,setSlice]=useState(null),[crosshair,setCrosshair]=useState([.5,.5]),[fixed,setFixed]=useState(false),[limits,setLimits]=useState([0,1]);
  const [layers,setLayers]=useState({showGt:true,showPrediction:true,gtOpacity:.65,predictionOpacity:.8});
  const [memory,setMemory]=useState('');const controllers=useRef(null),latest=useRef(0),frameList=useRef(frames);frameList.current=frames;
  const single=Boolean(comparison?.settings?.previewOnly);
  useEffect(()=>{
    controllers.current={frames:createFrameController({fetchFrame:loadFieldFrame,decode:decodeFieldFrame}),geometry:createGeometryClient()};
    return()=>{latest.current++;controllers.current?.frames.dispose();controllers.current?.geometry.dispose();controllers.current=null};
  },[comparison.id]);
  useEffect(()=>{setDisplayed(null);setMetrics(null);setRequested(null);setError('')},[comparison.id]);
  useEffect(()=>{if(frames.length&&!frames.includes(requested)){const saved=readOnly?null:readSession('field-view');setRequested(saved?.comparisonId===comparison.id&&frames.includes(saved.frame)?saved.frame:frames[0])}},[frames,requested,comparison.id,readOnly]);
  useEffect(()=>{if(!readOnly&&requested!=null)writeSession('field-view',{mode,comparisonId:comparison.id,frame:requested})},[mode,requested,comparison.id,readOnly]);
  useEffect(()=>{let valid=true;if(readOnly||metricsOverride){setMetrics(metricsOverride??null);return}loadFieldMetrics(comparison.id).then(data=>{if(valid)setMetrics(data)}).catch(e=>{if(valid){setMetrics(null);setError(e.message)}});return()=>{valid=false}},[comparison.id,frames.length,comparison.status,metricsOverride,readOnly]);
  const info=displayed?fieldIdsForGroup(displayed.snapshot.data,activeGroup):null;
  const first=displayed?.snapshot.data.fields.find(f=>f.id===(info?.groundTruth?.ids[0]||info?.prediction?.ids[0]));
  const dimensions=first?.shape||lattice?.dimensions;
  const maximum=dimensions?dimensions[plane==='yz'?0:plane==='xz'?1:2]-1:0,effectiveSlice=Math.max(0,Math.min(slice??Math.floor(maximum/2),maximum));
  const settings=useMemo(()=>({group:activeGroup,mode:single?'gt':mode,quality,component,opacity,showContext:context,vectorDensity:density,arrowScale,plane,sliceIndex:effectiveSlice,sourceRange:fixed&&limits[1]>limits[0]?limits:null,unit:info?.unit}),[activeGroup,mode,single,quality,component,opacity,context,density,arrowScale,plane,effectiveSlice,fixed,limits,info?.unit]);
  // Only geometry-affecting parameters participate; camera/color/opacity never refetch fields.
  const geometrySettings=useMemo(()=>({group:activeGroup,quality,component,showContext:context,vectorDensity:density,arrowScale,plane,sliceIndex:effectiveSlice,previewOnly:single}),[activeGroup,quality,component,context,density,arrowScale,plane,effectiveSlice,single]);
  useEffect(()=>{
    const owners=controllers.current;if(!owners||requested==null)return;const ticket=++latest.current;let alive=true;setBusy(true);setError('');
    (async()=>{
      try{
        const snapshot=await owners.frames.select(comparison.id,requested);if(!snapshot||!alive||ticket!==latest.current)return;
        let geometry;try{geometry=await owners.geometry.request(snapshot,lattice,geometrySettings)}catch(e){geometry={layers:[],warnings:[`3D preparation unavailable: ${e.message}. Use slices below.`],byteLength:0}}
        if(!geometry||!alive||ticket!==latest.current)return;
        setDisplayed({snapshot,geometry,settings:geometrySettings});setBusy(false);const stat=owners.frames.stats();setMemory(stat.oversize?'Active frame exceeds preview cache budget':`${(stat.bytes/1048576).toFixed(0)} MiB decoded cache`);
        const index=frameList.current.indexOf(requested);owners.frames.prefetch(comparison.id,[frameList.current[index+1],frameList.current[index-1]].filter(n=>n!=null));
      }catch(e){if(alive&&ticket===latest.current){setError(e.message);setBusy(false)}}
    })();return()=>{alive=false};
  },[comparison.id,requested,geometrySettings,lattice]);
  const bounds=useMemo(()=>worldBounds(processing?.lattice),[processing?.lattice]);
  const onFrame=useCallback(n=>setRequested(n),[]),shown=displayed?.snapshot.frameNumber,currentMetrics=shown==null?null:metrics?.frames?.[String(shown)];
  const shownGroup=displayed?.settings.group||activeGroup,shownInfo=displayed?fieldIdsForGroup(displayed.snapshot.data,shownGroup):null;
  const shownSettings={...settings,...displayed?.settings,...layers,unit:shownInfo?.unit};
  const shownFirst=displayed?.snapshot.data.fields.find(f=>f.id===(shownInfo?.groundTruth?.ids[0]||shownInfo?.prediction?.ids[0]));
  const position=processing?.lattice?physicalSlicePosition(processing.lattice,plane,effectiveSlice):null;
  return <div className="field-workbench">
    <aside className="field-sidebar"><details ref={setupDetails} className="field-setup" open={!comparison}><summary>{readOnly?'Published dataset details':tr("Datasets & comparison setup")}</summary>{setup}</details>
      <h2>{tr("Display controls")}</h2><div className="field-tabs compact">{['sdf','velocity'].map(kind=><button key={kind} aria-label={kind==='sdf'?'SDF':'Velocity'} disabled={!comparison.availableGroups.includes(kind)} aria-pressed={activeGroup===kind} onClick={()=>onActiveGroup(kind)}>{kind==='sdf'?tr("SDF"):tr("Velocity")}{!comparison.availableGroups.includes(kind)&&<small>{tr("Not available")}</small>}</button>)}</div>
      <label>{tr("3D display mode")}<select aria-label={tr("3D display mode")} value={single?'gt':mode} disabled={single} onChange={e=>setMode(e.target.value)}><option value="split">{tr("Side by side · linked")}</option><option value="wire-overlay">{tr("Solid + X-ray wireframe · overlap safe")}</option><option value="overlay">{tr("Transparent overlay · blue / orange")}</option><option value="gt">{tr("Ground Truth only")}</option><option value="prediction">{tr("Prediction only")}</option></select></label>
      {mode==='wire-overlay'&&!single&&<small className="field-mode-help">{tr("Blue: GT surface. Orange: Prediction wireframe, visible through GT. Geometry and scores are unchanged.")}</small>}
      <label>{tr("Preview quality")}<select value={quality} onChange={e=>setQuality(e.target.value)}><option value="balanced">{tr("Balanced · stride 2")}</option><option value="fine">{tr("Fine · stride 1")}</option></select></label><small>{tr("Display only. Metrics retain the comparison lattice.")}</small>
      <fieldset className="field-layer-controls"><legend>{tr("Visible layers")}</legend>{[['Gt','Ground Truth','gtOpacity'],...(!single?[['Prediction','Prediction','predictionOpacity']]:[])].map(([key,label,alpha])=><div key={key} className="field-layer-row"><label className="check"><input type="checkbox" checked={layers[`show${key}`]} onChange={e=>setLayers(s=>({...s,[`show${key}`]:e.target.checked}))}/><span className={`field-layer-dot ${key==='Gt'?'gt':'prediction'}`}/>{tr(label)}</label><label>{tr(label)}{tr(" opacity ")}<output>{Math.round(layers[alpha]*100)}%</output><input aria-label={`${label} opacity`} type="range" min=".1" max="1" step=".05" value={layers[alpha]} disabled={!layers[`show${key}`]} onChange={e=>setLayers(s=>({...s,[alpha]:Number(e.target.value)}))}/></label></div>)}</fieldset>
      {activeGroup==='velocity'&&<><label>{tr("Velocity display")}<select value={component} onChange={e=>setComponent(e.target.value)}>{['magnitude','x','y','z'].map(k=><option key={k} value={k}>{k==='magnitude'?(single?'Magnitude':tr("Magnitude / EPE")):k.toUpperCase()}</option>)}</select></label><label>{tr("Vector count limit")}<input type="number" min="1" max="20000" value={density} onChange={e=>setDensity(Math.max(1,Math.min(20000,Number(e.target.value)||1)))}/></label><label>{tr("Arrow scale")}<input type="number" min=".001" step=".1" value={arrowScale} onChange={e=>setArrowScale(Math.max(.001,Number(e.target.value)||1))}/></label>{comparison.availableGroups.includes('sdf')&&<label className="check"><input type="checkbox" checked={context} onChange={e=>setContext(e.target.checked)}/>{tr(" Show SDF context")}</label>}</>}
      <h2>{tr("Cross section")}</h2><label>{tr("Plane")}<select aria-label={tr("Slice plane")} value={plane} onChange={e=>{setPlane(e.target.value);setSlice(null)}}>{['xy','xz','yz'].map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}</select></label><label>{tr("Slice ")}{effectiveSlice} / {maximum}<input aria-label={tr("Slice index")} type="range" min="0" max={maximum} value={effectiveSlice} onChange={e=>setSlice(Number(e.target.value))}/></label><small>{tr("World: ")}{position?position.map(n=>n.toFixed(3)).join(', '):'—'}</small>
      <label className="check"><input type="checkbox" checked={fixed} onChange={e=>setFixed(e.target.checked)}/>{tr(" Fixed source color range")}</label>{fixed&&<div className="row">{limits.map((v,i)=><input key={i} aria-label={i?'Color maximum':'Color minimum'} type="number" value={v} step=".01" onChange={e=>setLimits(a=>a.map((n,k)=>k===i?Number(e.target.value):n))}/>)}</div>}
      {readOnly&&single?<details className="alignment-report"><summary>Grid and provenance</summary><dl><div><dt>Canonical lattice</dt><dd>{lattice?.dimensions?.join(' × ')} voxels</dd></div><div><dt>Voxel size</dt><dd>{lattice?.voxelSize?.join(' × ')||'See source declaration'}</dd></div><div><dt>Source</dt><dd>Simulation Ground Truth. No prediction alignment or error comparison.</dd></div></dl></details>:<AlignmentReport lattice={processing?.lattice} comparison={comparison}/>}
    </aside>
    <div className="field-center"><details className="field-saved-note"><summary>{single?tr("Single dataset preview — no comparison scores"):`Evaluation: ${Object.values(comparison.settings?.sdf||{}).some(c=>c?.semantics==='water_interior')?'conditional GT-water distance support':comparison.settings?.sdfEvaluationRegion==='gt_water'?'GT water only':'full domain'} · Saved settings`}</summary><p>{readOnly?(single?'Ground Truth fields are shown for inspection. This example contains no prediction and has no error metrics.':'Precomputed results retain the original comparison settings and validity masks. Conditional GT-water distance scores describe their valid support only. Occupancy and surface metrics use separate validity rules; unsupported metrics remain N/A. This example is not a model-ranking benchmark. 3D and slices show the saved aligned fields.'):tr("Results use the saved comparison settings. Create a new comparison after changing declarations. Occupancy and surface metrics have separate validity rules. Original scores are not certified for model ranking; use Results Library common-support evaluation. 3D and slices show the original aligned fields.")}</p></details>
      <FieldViewport key={comparison.id} frameSplit={frameSplit} displayedFrame={shown} labels={comparison.labels} geometry={displayed?.geometry} settings={shownSettings} bounds={bounds} loadingFrame={busy?requested:null} error={error}/>
      <FieldTimeline active={active} frameSplit={frameSplit} frames={frames} displayedFrame={shown} requestedFrame={requested} status={comparison.status||'ready'} loading={busy} onFrame={onFrame} onScrubbing={v=>controllers.current?.frames.setScrubbing(v)}/>
      <section className="field-slices"><h2>{tr("Synchronized slices & probe")}</h2>{shownFirst?<SliceTriptych frameNumber={shown} frameSplit={frameSplit} exportStem={exportStem} frame={displayed.snapshot.data} group={shownGroup} plane={shownSettings.plane} sliceIndex={shownSettings.sliceIndex} crosshair={crosshair} onCrosshair={setCrosshair} component={shownSettings.component} fixedRange={settings.sourceRange} lattice={lattice} single={single} label="Ground Truth"/>:<p>{tr("No field samples available for this view.")}</p>}</section>
      {!single&&<SequenceMetrics frameSplit={frameSplit} onReviewSetup={reviewSetup} comparisonId={exportStem} frames={frames} expectedFrames={expectedFrames} metrics={metrics} groups={comparison.availableGroups} group={shownGroup} status={comparison.status} currentFrame={shown} onFrame={onFrame} sdfUnit={fieldIdsForGroup(displayed?.snapshot.data,'sdf').unit||comparison.settings?.sdf?.gt?.unit||'unit undeclared'} velocityUnit={fieldIdsForGroup(displayed?.snapshot.data,'velocity').unit||comparison.settings?.velocity?.gt?.unit||'unit undeclared'}/>}
      <small className="field-memory">{memory}{readOnly?' · Published samples · Geometry prepared in your browser':tr(" · Geometry prepared off the UI thread · No cloud upload")}</small>
    </div>
    <aside className="field-results"><h2>{tr("Current frame ")}<span>{shown??'—'}</span></h2>{single?<p>{tr("Single dataset preview — no comparison scores")}</p>:<MetricsPanel metrics={currentMetrics} group={shownGroup} unit={shownInfo?.unit||''}/>}
      {!single&&<><LossDefinitions group={shownGroup}/><div className="field-exports"><h2>{tr("Export results")}</h2><button disabled={!metrics} onClick={()=>download(`${exportStem}_metrics.json`,JSON.stringify(metrics,null,2))}>{tr("Export JSON")}</button><button disabled={!currentMetrics} onClick={()=>{const rows=['metric,value',`sdf_error_region,${currentMetrics?.sdf?.evaluationRegion||comparison.settings?.sdfEvaluationRegion||'full_domain'}`];for(const [key,value] of Object.entries(currentMetrics?.[shownGroup]||{}))if(typeof value==='number'||value===null)rows.push(`${key},${value??''}`);download(`${exportStem}_${shown}_${shownGroup}.csv`,rows.join('\n'),'text/csv')}}>{tr("Export CSV")}</button><small>{readOnly?'Download saved values: JSON includes all metric records; CSV describes the displayed frame.':tr("JSON: sequence · CSV: displayed frame. Saved-result ZIP includes source names and complete provenance.")}</small></div></>}
      {!single&&<p>{tr("All metric averages and per-frame values are below the synchronized slices. Use the SDF / Velocity tabs to switch field groups.")}</p>}
    </aside>
  </div>;
}
