import {useI18n} from './i18n.jsx';
import React from 'react';
export const COLORS={calm:'#3478ef',gentle:'#12a576',strong:'#e88038'};
export default function ProfileChart({profiles,axis,reference,scale}){
 const {tr}=useI18n();

 const entries=Object.entries(profiles),rows=entries.flatMap(([,v])=>v),valid=rows.filter(r=>r[1]!==null);
 if(!valid.length)return <div className="empty">{tr("No water intersection at this section position.")}</div>;
 const xs=rows.map(r=>r[0]*scale),ys=valid.map(r=>(r[1]-reference)*scale);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(-.25,...ys),y1=Math.max(.75,...ys),pad=(y1-y0)*.12;
 const X=x=>64+(x*scale-x0)/(x1-x0||1)*780,Y=y=>210-((y-reference)*scale-(y0-pad))/(y1-y0+pad*2)*178;
 return <svg className="profile-chart" viewBox="0 0 880 260" role="img" aria-label={tr("Measured surface elevation cross section")}>
 {[0,1,2,3,4].map(i=>{const y=y0-pad+i/4*(y1-y0+pad*2),yp=210-i/4*178;return <g key={'y'+i}><line x1="64" x2="844" y1={yp} y2={yp} stroke="#dde5ec"/><text x="54" y={yp+4} textAnchor="end">{y.toFixed(2)}</text></g>})}
 {[0,1,2,3,4,5].map(i=>{const xp=64+i/5*780;return <g key={'x'+i}><line x1={xp} x2={xp} y1="32" y2="210" stroke="#e4ebf0"/><text x={xp} y="231" textAnchor="middle">{(x0+i/5*(x1-x0)).toFixed(1)}</text></g>})}
 {entries.map(([name,data])=>{let open=false;const d=data.map(([x,y])=>{if(y===null){open=false;return ''}const c=(open?'L':'M')+X(x).toFixed(2)+','+Y(y).toFixed(2);open=true;return c}).join(' ');return <path key={name} d={d} fill="none" stroke={COLORS[name]||'#008ca0'} strokeWidth="2.2"/>})}
 <text x="456" y="255" textAnchor="middle">{axis.toUpperCase()}{tr(" (m)")}</text><text transform="translate(17 125) rotate(-90)" textAnchor="middle">{tr("η (m)")}</text>
 </svg>;
}
