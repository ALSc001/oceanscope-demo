import React from 'react';
export default function FrameCurvePoint({point:p,row,selected,onFrame,language}){
 const enabled=Boolean(onFrame&&row?.available),type=row?.predictionType||'unassigned';
 const color={train:'#b66b14',validation:'#8052bc',test:'#008c9c',unassigned:'#7b8794'}[row?.split||'unassigned'];
 return <g transform={`translate(${p.x},${p.y})`} role="button" aria-label={`${language==='zh'?'选择曲线帧':'Select plotted frame'} ${p.frame}`} aria-disabled={!enabled} tabIndex={enabled?0:-1} onClick={()=>enabled&&onFrame(p.frame)} onKeyDown={e=>{if(enabled&&['Enter',' '].includes(e.key)){e.preventDefault();onFrame(p.frame)}}} style={{cursor:enabled?'pointer':'default'}}>
 <title>{`Frame ${p.frame}: ${p.value} | ${row?.split||'unassigned'} | ${type}`}</title><circle r="7" fill="transparent"/>
 {selected&&<circle r="7" fill="none" stroke="#d36218" strokeWidth="2"/>}
 {type==='anchor'?<rect x="-4" y="-4" width="8" height="8" fill={color}/>:type==='extrapolation'?<path d="M 0 -5 L 5 4 L -5 4 Z" fill={color}/>:type==='interpolation'?<path d="M 0 -5 L 5 0 L 0 5 L -5 0 Z" fill={color}/>:<circle r="3" fill={color}/>}
 </g>;
}
