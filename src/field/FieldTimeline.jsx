import {useI18n} from '../i18n.jsx';
import React,{useEffect,useState} from 'react';
import {nextFrame} from './sequencePlayback.js';
import FrameSplitBadge from './FrameSplitBadge.jsx';
export default function FieldTimeline({frames,displayedFrame,requestedFrame,status='ready',loading=false,previewFps=24,onFrame,onScrubbing,timing,frameSplit,active=true}){
 const {tr}=useI18n();

  const [playing,setPlaying]=useState(false),[loop,setLoop]=useState(false),[fps,setFps]=useState(previewFps),[speed,setSpeed]=useState(1),[entry,setEntry]=useState('');
  useEffect(()=>{if(!active)setPlaying(false)},[active]);
  useEffect(()=>setEntry(String(requestedFrame??displayedFrame??'')),[requestedFrame,displayedFrame]);
  useEffect(()=>{if(frames.length<2)setPlaying(false)},[frames.length]);
  useEffect(()=>{
    if(!playing||loading)return;const timer=setTimeout(()=>{const next=nextFrame({frames,current:displayedFrame,loop,status});if(next.action==='select')onFrame(next.frame);else if(next.action==='stop')setPlaying(false)},1000/(Math.max(1,fps)*speed));return()=>clearTimeout(timer);
  },[playing,loading,displayedFrame,frames,loop,status,fps,speed,onFrame]);
  function step(direction){setPlaying(false);const next=nextFrame({frames,current:requestedFrame??displayedFrame,direction,status});if(next.action==='select')onFrame(next.frame)}
  function commit(){const n=Number(entry);if(frames.includes(n))onFrame(n);else setEntry(String(requestedFrame??displayedFrame??''))}
  const gaps=frames.some((n,i)=>i>0&&n!==frames[i-1]+1);
  return <section className="field-timeline" aria-label={tr("Animation controls")}>
    <FrameSplitBadge manifest={frameSplit} frame={displayedFrame}/>
    <div className="field-play-controls"><button aria-label={tr("First frame")} disabled={!frames.length} onClick={()=>{setPlaying(false);onFrame(frames[0])}}>⏮</button><button aria-label={tr("Previous frame")} disabled={frames.length<2} onClick={()=>step(-1)}>‹</button><button className="primary" disabled={frames.length<2} onClick={()=>setPlaying(v=>!v)}>{playing?tr("Pause"):tr("Play")}</button><button aria-label={tr("Next frame")} disabled={frames.length<2} onClick={()=>step(1)}>›</button><button aria-label={tr("Last frame")} disabled={!frames.length} onClick={()=>{setPlaying(false);onFrame(frames.at(-1))}}>⏭</button><label><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/>{tr(" Loop")}</label><label>{tr("Speed")}<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.25,.5,1,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></label></div>
    <input aria-label={tr("Sequence timeline")} type="range" min="0" max={Math.max(0,frames.length-1)} value={Math.max(0,frames.indexOf(requestedFrame??displayedFrame))} disabled={frames.length<2} onPointerDown={()=>{setPlaying(false);onScrubbing?.(true)}} onPointerUp={()=>onScrubbing?.(false)} onPointerCancel={()=>onScrubbing?.(false)} onBlur={()=>onScrubbing?.(false)} onKeyDown={e=>{onScrubbing?.(true);if(['Home','End'].includes(e.key)){e.preventDefault();setPlaying(false);onFrame(e.key==='Home'?frames[0]:frames.at(-1))}}} onKeyUp={()=>onScrubbing?.(false)} onChange={e=>{setPlaying(false);onFrame(frames[Number(e.target.value)])}}/>
    <div className="field-time-labels"><span>{tr("Displayed frame ")}<strong>{displayedFrame??'—'}</strong>{loading?` · ${tr('Loading')} ${requestedFrame}…`:''}</span><label>{tr("Go to frame")}<input aria-label={tr("Comparison frame")} type="number" value={entry} onChange={e=>setEntry(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit()}}/></label><label>{tr("Preview FPS")}<input aria-label={tr("Preview FPS")} type="number" min="1" max="120" value={fps} onChange={e=>setFps(Math.max(1,Math.min(120,Number(e.target.value)||24)))}/></label><small>{timing?.fps>0&&Number.isFinite(timing.originFrame)?`${tr('Time')}: ${((displayedFrame-timing.originFrame)/timing.fps+(timing.offsetSeconds||0)).toFixed(3)} s`:tr("Playback timing only — not physical simulation time")}</small></div>
    <small>{frames.length}{tr(" available frames")}{gaps?tr(" · Missing frames skipped; no interpolation"):''}{status==='processing'?tr(" · Processing continues; playback waits at the latest frame"):status==='error'?tr(" · Processing failed; completed frames remain available"):''}</small>
  </section>;
}
