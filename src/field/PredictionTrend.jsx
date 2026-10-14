import React from 'react';
import {useI18n} from '../i18n.jsx';
import {predictionHorizon} from './predictionHorizon.js';
import {formatMetric} from './sequenceMetrics.js';
export default function PredictionTrend({rows,metricKey,manifest,modelName}){
 const {language}=useI18n(),zh=language==='zh',groups=new Map();let missing=0;
 const declarations=new Map((manifest?.rows??[]).map(r=>[r.frame,r]));
 for(const row of rows){
  const declaration=declarations.get(row.frame);
  if(declaration?.prediction_type!=='extrapolation')continue;
  const seconds=predictionHorizon(declaration);
  if(seconds===null){missing++;continue;}
  const key=`${declaration.prediction_origin_frame} / ${declaration.fps} fps`;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({frame:row.frame,seconds,value:row.values[metricKey]});
 }
 if(!groups.size&&!missing)return null;
 return <details><summary>{modelName&&`${modelName} · `}{zh?'未来外推时间趋势':'Future prediction horizon'}</summary><p>{zh?'按声明的输入起点和 FPS 分图；缺失帧不连线，不合并不同预测。':'Separate plots for declared origin and FPS; missing frames are not connected and different predictions are not merged.'}</p>
 {missing>0&&<p>{zh?`${missing} 帧缺少有效时间声明，仍使用上方帧号曲线。`:`${missing} frame(s) without valid timing; retain the frame-number plot above.`}</p>}
 {[...groups].map(([key,points])=>{
  const values=points.filter(p=>Number.isFinite(p.value)),maxX=Math.max(1,...points.map(p=>p.seconds));
  const lo=values.length?Math.min(...values.map(p=>p.value)):0,hi=values.length?Math.max(...values.map(p=>p.value)):1;
  const x=p=>50+p.seconds/maxX*510,y=p=>160-(p.value-lo)/(hi-lo||1)*120;
  return <figure key={key}><figcaption>{zh?'预测起点':'Prediction origin'} {key} · {metricKey}</figcaption><svg role="img" aria-label={`Prediction horizon ${key}`} viewBox="0 0 600 200" width="100%">
   <line x1="50" x2="560" y1="160" y2="160" stroke="#a9bac8"/>
   {points.map((p,i)=>{const prev=points[i-1];return Number.isFinite(p.value)&&<g key={p.frame}>{prev&&p.frame===prev.frame+1&&Number.isFinite(prev.value)&&<line x1={x(prev)} y1={y(prev)} x2={x(p)} y2={y(p)} stroke="#008c9c"/>}<circle cx={x(p)} cy={y(p)} r="4" fill="#008c9c"><title>{p.frame}: {formatMetric(p.value)}; {formatMetric(p.seconds)} s</title></circle></g>})}
   <text x="8" y="40">{formatMetric(hi)}</text><text x="8" y="160">{formatMetric(lo)}</text><text x="50" y="186">0</text><text x="500" y="186">{formatMetric(maxX)} s</text>
  </svg></figure>;
 })}</details>;
}
