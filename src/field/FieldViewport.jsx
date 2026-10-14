import {useI18n} from '../i18n.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {createFieldScene} from './FieldScene.js';
import FrameSplitBadge from './FrameSplitBadge.jsx';
export default function FieldViewport({geometry,settings,bounds,loadingFrame,error,labels,cameraState,onCameraChange,frameSplit,displayedFrame}){
 const {tr}=useI18n();

  const container=useRef(null),scene=useRef(null),fitted=useRef(false);const [renderError,setRenderError]=useState('');
  const cameraCallback=useRef(onCameraChange),applyingCamera=useRef(false);cameraCallback.current=onCameraChange;
  useEffect(()=>{try{scene.current=createFieldScene(container.current,{onCameraChange:pose=>{if(!applyingCamera.current)cameraCallback.current?.(pose)}})}catch(e){setRenderError(`3D unavailable: ${e.message}. Slices remain available.`)}return()=>{scene.current?.dispose();scene.current=null}},[]);
  useEffect(()=>{if(cameraState){applyingCamera.current=true;try{scene.current?.setCamera(cameraState)}finally{applyingCamera.current=false}}},[cameraState]);
  useEffect(()=>{scene.current?.setDisplay(settings)},[settings]);
  useEffect(()=>{scene.current?.setGeometry(geometry)},[geometry]);
  useEffect(()=>{if(bounds&&!fitted.current){scene.current?.fit(bounds);fitted.current=true}},[bounds]);
  const velocity=settings.group==='velocity';let min=Infinity,max=-Infinity;for(const l of geometry?.layers||[])for(const v of l.values||[]){min=Math.min(min,v);max=Math.max(max,v)}const range=settings.sourceRange||[min,max];
  return <section className="field-viewport" aria-label={tr("3D field visualization")}>
    <div className="field-view-heading"><strong>{velocity?tr("3D velocity field"):tr("3D zero-isosurface")}</strong><span>{tr("Frame ")}{displayedFrame??'—'} · <FrameSplitBadge manifest={frameSplit} frame={displayedFrame}/></span><button onClick={()=>scene.current?.fit(bounds)}>{tr("Fit view")}</button></div>
    <div className="field-scene" ref={container}/>
    <div className={`field-role-labels ${settings.mode==='split'?'split':''}`} aria-hidden="true">{settings.mode!=='prediction'&&<span>{labels?.gt?.displayName?`GT · ${labels.gt.displayName} · ${velocity?'shared scale':'blue'}`:settings.previewOnly?tr("Dataset preview"):velocity?tr("GT · shared color scale"):tr("GT · blue")}{settings.showGt===false?tr(" · hidden"):''}</span>}{settings.mode!=='gt'&&<span>{labels?.prediction?.displayName?`Prediction · ${labels.prediction.displayName} · ${velocity?'shared scale':'orange'}`:velocity?tr("Prediction · shared color scale"):tr("Prediction · orange")}{settings.showPrediction===false?tr(" · hidden"):settings.mode==='wire-overlay'?tr(" · X-ray wireframe"):''}</span>}</div>
    {velocity&&<div className="field-legend">{settings.component==='magnitude'?tr("Speed magnitude"):`Velocity ${settings.component?.toUpperCase()}`}<div className="field-gradient"/>{range.every(Number.isFinite)?`${range[0].toPrecision(3)} — ${range[1].toPrecision(3)}`:tr("No valid samples")} <span>{settings.unit||tr("units undeclared")}</span></div>}
    {loadingFrame!=null&&<div role="status" className="field-view-loading">{tr("Loading frame ")}{loadingFrame}…</div>}
    {(renderError||error)&&<p role="alert" className="field-view-error">{renderError||error}</p>}
    {geometry?.warnings?.length>0&&<p className="field-view-warning">{geometry.warnings.join(' · ')}</p>}
    <small className="field-view-help">{tr("Drag to orbit · Scroll to zoom · ")}{velocity?tr("Instantaneous velocity vectors, not particle paths"):tr("SDF = 0; display-only mesh")}{tr(" · X / Y up / Z · Preview quality: ")}{settings.quality||tr("balanced")}</small>
  </section>;
}
