import {useI18n} from '../i18n.jsx';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {buildSequenceReport,chartPoints,formatMetric,reportCsv} from './sequenceMetrics.js';
import FrameSplitBadge from './FrameSplitBadge.jsx';
import FrameReview from './FrameReview.jsx';
import FrameCurvePoint from './FrameCurvePoint.jsx';
import {testTypeOptions} from './frameMembership.js';
import PredictionTrend from './PredictionTrend.jsx';
import HeightSupportAudit from './HeightSupportAudit.jsx';

function download(name,text){const url=URL.createObjectURL(new Blob(['\uFEFF',text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
const EMPTY_FRAMES=[];
export default function SequenceMetrics({metrics,frames,expectedFrames=EMPTY_FRAMES,groups:fieldGroups,group:displayGroup,status,currentFrame,onFrame,onDownload=download,comparisonId='comparison',sdfUnit='m',velocityUnit='m/s',onReviewSetup,frameSplit}){
 const {tr,language}=useI18n();
 const [subset,setSubset]=useState(()=>frameSplit?'test':'all');
 const hasHeight=Object.values(metrics?.frames||{}).some(f=>f.elevation);
 const groups=useMemo(()=>hasHeight?[...fieldGroups,'elevation']:fieldGroups,[fieldGroups,hasHeight]);
 const [statGroup,setStatGroup]=useState('');const group=groups.includes(statGroup)?statGroup:displayGroup;
 useEffect(()=>setStatGroup(''),[displayGroup]);
 useEffect(()=>setSubset(frameSplit?'test':'all'),[frameSplit?.sha256,Boolean(frameSplit)]);

 const report=useMemo(()=>buildSequenceReport({metrics,frames,expectedFrames,groups,status,units:{sdf:sdfUnit,velocity:velocityUnit},frameSplit,frameSubset:subset}),[metrics,frames,expectedFrames,groups,status,sdfUnit,velocityUnit,frameSplit,subset]);
 const columns=report.columns.filter(c=>c.group===group),summaries=report.summary.filter(s=>s.group===group);
 const [selected,setSelected]=useState(''),[page,setPage]=useState(0),[width,setWidth]=useState(640);const host=useRef(null);
 const metric=columns.find(c=>c.id===selected)||columns[0];
 useEffect(()=>{if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(([entry])=>setWidth(Math.max(280,Math.round(entry.contentRect.width))));observer.observe(host.current);return()=>observer.disconnect()},[]);
 const plot=useMemo(()=>chartPoints(report.rows,metric?.id,width),[report.rows,metric?.id,width]);
 const pageCount=Math.max(1,Math.ceil(report.rows.length/50)),shownPage=Math.min(page,pageCount-1),pageRows=report.rows.slice(shownPage*50,(shownPage+1)*50);
 const rowIndex=useMemo(()=>new Map(report.rows.map(r=>[r.frame,r])),[report.rows]);
 const current=rowIndex.get(currentFrame),aggregate=report.summary.find(s=>s.id===metric?.id);
 return <section className="sequence-metrics" ref={host} aria-label={tr("Sequence loss analysis")}>
  <h2>{tr("Per-frame metrics & sequence averages")}</h2>
  <label>{language==='zh'?'统计组':'Statistics group'} <select aria-label="Statistics group" value={group} onChange={e=>setStatGroup(e.target.value)}>{groups.map(g=><option key={g} value={g}>{g==='elevation'?(language==='zh'?'水面高度':'Water-surface elevation'):g.toUpperCase()}</option>)}</select></label>
  {group==='elevation'&&<p>{language==='zh'?'世界 Y 水面高度，不是波峰—波谷浪高或 Hs。固定填值、缺失支持和多层水面不可用于此评分。':'World-Y elevation, not crest-to-trough wave height or Hs. Filled exterior, missing support and multiple surfaces cannot be scored.'}</p>}
  {group==='elevation'&&<HeightSupportAudit data={metrics?.frames?.[currentFrame]?.elevation}/>}
  <p className="research-warning">{(subset==='test'||subset.startsWith('test_'))?(language==='zh'?'Test 报告：仅汇总清单声明的测试帧。':'Test report: only declared test frames are summarized.'):subset==='train'?(language==='zh'?'Train 报告：训练帧表现，不代表未见数据的泛化效果。':'Train report: training-frame performance, not generalization to unseen data.'):language==='zh'?'参考报告：不是独立的 Test 结果。':'Reference report: not a Test-only evaluation.'} {language==='zh'?'划分依据训练方清单，不独立核验训练历史。':'Membership follows the supplied manifest; training history is not independently verified.'}</p>
  <div className="frame-split-toolbar"><label>{language==='zh'?'统计帧集合':'Evaluation subset'} <select aria-label="Evaluation subset" value={subset} onChange={e=>{setSubset(e.target.value);setPage(0)}}>{Object.entries({all:language==='zh'?'全部（参考）':'All',train:'Train',validation:'Validation',test:'Test',...testTypeOptions(language==='zh'),unassigned:language==='zh'?'未划分':'Unassigned'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><small>{language==='zh'?'仅筛选曲线、统计表和下方 CSV；不改变原始计算或动画。':'Filters curves, tables and the CSVs below; original calculations and playback are unchanged.'}</small></div>
  {report.total===0&&<p role="status">{language==='zh'?'此集合没有已声明的帧；不补零，也不使用其他集合替代。':'No declared frames in this subset; no zeros or fallback to another subset.'}</p>}
  <p>{tr("SDF error region: ")}<strong>{report.evaluationRegion==='gt_water_common_distance_support'?tr("Conditional GT-water distance support"):report.evaluationRegion==='gt_water'?tr("GT water only (GT SDF < 0)"):tr("Full domain (valid pairs)")}</strong>{tr(". Occupancy and surface metrics use their own saved validity rules; they are not certified by the distance mask. Velocity metrics unchanged.")}</p>
  <p className="sequence-partial" role="status">{report.blockedReasons.length?tr("Scoring blocked"):report.complete?(language==='zh'?'帧记录处理完成':'Processing complete'):tr("Partial results")} · {report.calculated} / {report.total}{tr(" frame records processed")}{status==='error'?tr(" · Processing stopped"):''}</p>
  <p role="status">{!report.total?(language==='zh'?'当前集合为空。':'Selected subset is empty.'):!aggregate?.valid?(language==='zh'?'所选指标不可用：没有有效数值。处理完成不代表评分有效。':'Selected metric unavailable: no valid values. Completed processing does not imply valid scoring.'):(language==='zh'?`所选指标有效帧：${aggregate.valid} / ${report.total}；排除 ${aggregate.excluded} 帧。`:`Selected metric valid frames: ${aggregate.valid} / ${report.total}; ${aggregate.excluded} excluded.`)}</p>
  {report.blockedReasons.length>0&&<div className="error" role="alert"><strong>{tr("No valid loss can be reported for blocked fields.")}</strong>{report.blockedReasons.map(reason=><p key={reason}>{tr(reason)}</p>)}<p>{tr("Review units and SDF type in Datasets & comparison setup, then click Create comparison again. Old results do not change when declarations are edited. Unit confirmation declares the source scale; it does not convert data.")}</p>{onReviewSetup&&<button onClick={onReviewSetup}>{tr("Review scoring setup")}</button>}</div>}
  <p>{tr("Equal weight per valid frame. N/A is excluded, never zero. RMSE and P95 averages are means of frame metrics, not pooled-voxel metrics. No combined training loss.")}</p>
  <div className="sequence-toolbar"><label>{tr("Metric curve")}<select aria-label={tr("Metric curve")} value={metric?.id||''} onChange={e=>setSelected(e.target.value)}>{columns.map(c=><option key={c.id} value={c.id}>{tr(c.label)}</option>)}</select></label><span>{tr("Unit: ")}{tr(metric?.unit)} · {metric?.direction==='Context'?tr("Context metric"):tr(metric?.direction)+' '+tr('is better')}</span></div>
  <div className="sequence-readout">{tr("Frame ")}{currentFrame??'—'}: <strong>{formatMetric(current?.values[metric?.id])}</strong>{tr(" · Sequence mean: ")}<strong>{formatMetric(aggregate?.mean)}</strong>{tr(" · Valid: ")}{aggregate?.valid??0} / {report.total}</div>
  <FrameReview report={report} metric={metric} onFrame={onFrame} onDownload={onDownload} comparisonId={comparisonId} frameSplit={frameSplit}/>
  <p>{language==='zh'?'对应覆盖率（所选帧均值）':'Associated coverage (selected-frame mean)'}: {formatMetric(report.summary.find(s=>s.id===`${group}.coverage`)?.mean)}{group==='elevation'&&<> · {language==='zh'?'GT 可重建比例':'GT reconstructible fraction'}: {formatMetric(report.summary.find(s=>s.id==='elevation.gtCoverage')?.mean)}</>}</p>
  <PredictionTrend rows={report.rows} metricKey={metric?.id} manifest={frameSplit}/>
  <svg width="100%" height="220" viewBox={`0 0 ${width} 220`} role="img" aria-label={`${metric?.label} over frames; ${tr(metric?.unit)}`}>
   {[plot.min,(plot.min+plot.max)/2,plot.max].map((v,i)=><g key={i}><line x1="64" x2={width-22} y1={plot.y(v)} y2={plot.y(v)} stroke="#d7e1eb" strokeWidth=".75"/><text x="57" y={plot.y(v)+4} textAnchor="end">{formatMetric(v)}</text></g>)}
   {Number.isFinite(aggregate?.mean)&&<line x1="64" x2={width-22} y1={plot.y(aggregate.mean)} y2={plot.y(aggregate.mean)} stroke="#7a8797" strokeDasharray="5 4"/>}
   {plot.segments.map((segment,i)=><polyline key={i} points={segment.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#008c9c" strokeWidth="2"/>)}
   {plot.points.map(p=><FrameCurvePoint key={p.frame} point={p} row={rowIndex.get(p.frame)} selected={p.frame===currentFrame} onFrame={onFrame} language={language}/>)}
   {Number.isFinite(currentFrame)&&<line x1={plot.x(currentFrame)} x2={plot.x(currentFrame)} y1="25" y2="185" stroke="#d36218" strokeDasharray="3 3"/>}
   <text x="64" y="205">{plot.start}</text>{plot.end!==plot.start&&<text x={width-22} y="205" textAnchor="end">{plot.end}</text>}<text x={width/2} y="205" textAnchor="middle">{tr("Frame")}</text>
  </svg>
  <small>{language==='zh'?'颜色：训练橙 / 验证紫 / 测试青 / 未划分灰。形状：Anchor 方形 / 插值菱形 / 外推三角 / 未声明圆点。橙圈为当前帧，灰虚线为均值；缺失值不连线。':'Color: Train amber / Validation purple / Test teal / Unassigned gray. Shape: Anchor square / Interpolation diamond / Future extrapolation triangle / Undeclared circle. Orange ring: displayed frame; gray dashed line: mean. Missing values are not connected.'}</small>
  <h3>{group==='elevation'?(language==='zh'?'水面高度':'Elevation'):group==='sdf'?tr("SDF"):tr("Velocity")}{tr(" sequence summary")}</h3>
  <p>{language==='zh'?'中位数、P95 和总体标准差描述所选帧的分布，不代表统计显著性。':'Median, P95 and population standard deviation describe selected frames, not statistical significance.'}</p>
  <div className="sequence-table-scroll" tabIndex="0" role="region" aria-label={tr("Scrollable sequence summary")}><table aria-label={tr("Sequence metric summary")}><thead><tr>{['Metric','Unit','Mean',language==='zh'?'中位数':'Median','P95',language==='zh'?'总体标准差':'Population std. dev.','Minimum','Maximum','Valid / total','Excluded'].map(t=><th key={t}>{tr(t)}</th>)}</tr></thead><tbody>{summaries.map(s=><tr key={s.id}><th scope="row">{tr(s.label)}</th><td>{tr(s.unit)}</td>{[s.mean,s.median,s.p95,s.stddev,s.minimum,s.maximum].map((v,i)=><td key={i} title={v==null?'N/A':String(v)}>{formatMetric(v)}</td>)}<td>{s.valid} / {s.total}</td><td>{s.excluded}</td></tr>)}</tbody></table></div>
  <h3>{group==='elevation'?(language==='zh'?'水面高度':'Elevation'):group==='sdf'?tr("SDF"):tr("Velocity")}{tr(" per-frame values")}</h3>
  <div className="sequence-toolbar"><button disabled={shownPage===0} onClick={()=>setPage(shownPage-1)}>{tr("Previous rows")}</button><span>{tr("Page ")}{shownPage+1} / {pageCount}{tr(" · 50 frames per page")}</span><button disabled={shownPage+1>=pageCount} onClick={()=>setPage(shownPage+1)}>{tr("Next rows")}</button><button onClick={()=>{const i=report.rows.findIndex(r=>r.frame===currentFrame);if(i>=0)setPage(Math.floor(i/50))}}>{tr("Show current row")}</button></div>
  <div className="sequence-table-scroll" tabIndex="0" role="region" aria-label={tr("Scrollable per-frame metrics")}><table aria-label={tr("Per-frame metric values")}><thead><tr><th>{tr("Frame")}</th><th>{language==='zh'?'所属集合':'Split'}</th>{columns.map(c=><th key={c.id}>{tr(c.label)}<small>{c.unit}</small></th>)}</tr></thead><tbody>{pageRows.map(r=><tr key={r.frame} className={r.frame===currentFrame?'selected-frame':''}><th scope="row"><button aria-label={`Go to frame ${r.frame}`} aria-current={r.frame===currentFrame?'true':undefined} disabled={!r.available} onClick={()=>onFrame(r.frame)}>{r.frame}</button>{!r.calculated&&<small>{tr("Not calculated")}</small>}</th><td><FrameSplitBadge manifest={frameSplit} frame={r.frame}/></td>{columns.map(c=><td key={c.id} title={r.values[c.id]==null?'N/A':String(r.values[c.id])}>{formatMetric(r.values[c.id])}</td>)}</tr>)}</tbody></table></div>
  <div className="sequence-toolbar"><button disabled={!metrics||!report.total} onClick={()=>onDownload(`${comparisonId}_${subset}_frames.csv`,reportCsv(report,'frames'))}>{subset==='all'?tr("Export all frames CSV"):language==='zh'?'导出当前集合 CSV':'Export subset CSV'}</button><button disabled={!metrics||!report.total} onClick={()=>onDownload(`${comparisonId}_${subset}_sequence_summary.csv`,reportCsv(report,'summary'))}>{tr("Export sequence summary CSV")}</button><small>{language==='zh'?`两个场组 · 当前集合 ${subset} 的所有帧（不限本页） · 完整精度`:`Both field groups · all ${subset} frames (not only this page) · full numeric precision`}</small></div>
 </section>;
}
