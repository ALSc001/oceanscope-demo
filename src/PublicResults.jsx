import React,{useEffect,useState} from 'react';
import {useI18n} from './i18n.jsx';
import {loadPublicCases,downloadPublicFile,metricCSV} from './publicData.js';
export default function PublicResults({onOpen}){
 const {tr,language}=useI18n(),zh=language==='zh';
 const [manifest,setManifest]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;loadPublicCases().then(d=>{if(live){setManifest(d);setError('')}}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[retry]);
 const items=manifest?.cases.filter(c=>(filter==='all'||(filter==='comparison'?!c.comparison.settings?.previewOnly:c.comparison.settings?.previewOnly))&&`${c.name} ${c.description}`.toLowerCase().includes(query.toLowerCase()))||[];
 return <section className="public-results"><header><h1>{tr('Results Library')} <span>— {zh?'已发布的分析':'Published analyses'}</span></h1></header><div className="results-body">
  <p>{zh?'从已有结果进入三维工作台，或下载完整指标和数据说明。':'Open a saved result in the 3D workbench, or download its complete metrics and dataset details.'}</p>
  <div className="results-toolbar"><label>{zh?'搜索结果':'Search results'}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={zh?'名称或数据说明':'Name or dataset description'}/></label><label>{zh?'结果类型':'Result type'}<select aria-label={zh?'结果类型':'Result type'} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{zh?'全部':'All results'}</option><option value="comparison">{zh?'已保存的对比':'Saved comparisons'}</option><option value="preview">{zh?'单数据预览':'Single-dataset previews'}</option></select></label></div>
  {error?<div role="alert">{error}<button onClick={()=>setRetry(v=>v+1)}>{zh?'重试':'Retry'}</button></div>:!manifest?<p role="status">{zh?'正在读取结果库…':'Loading results…'}</p>:!items.length?<p role="status">{zh?'未找到匹配结果。请修改搜索条件。':'No matching results. Change your search or filter.'}</p>:<div className="published-results">{items.map(item=>{
   const single=item.comparison.settings?.previewOnly;
   return <article className="result-card" key={item.id}>
    <div className="result-card-heading"><span className="result-badge">{single?(zh?'单数据预览':'SINGLE-DATASET PREVIEW'):(zh?'已保存的对比':'SAVED COMPARISON')}</span><span>{item.comparison.availableGroups.join(' + ').toUpperCase()}</span></div><h2>{item.name}</h2><p>{item.description}</p>
    <dl className="result-facts"><div><dt>{zh?'三维帧':'3D frames'}</dt><dd>{item.processing.frames.length}</dd></div><div><dt>{zh?'指标帧':'Metric frames'}</dt><dd>{single?'—':Object.keys(item.metrics.frames).length}</dd></div><div><dt>{zh?'源帧范围':'Source range'}</dt><dd>{item.sourceFrameRange.start}–{item.sourceFrameRange.end}</dd></div><div><dt>{zh?'网格大小':'Grid dimensions'}</dt><dd>{item.processing.lattice.dimensions.join(' × ')}</dd></div></dl>
    <p className="result-scope">{single?(zh?'没有 Prediction，不提供对比误差。单位未声明。':'No Prediction or comparison errors. Units are undeclared.'):(zh?'距离评分仅覆盖条件性 GT 水体有效区域；结合覆盖率解读，不作为模型排名。':'Distance scores cover conditional GT-water support. Read with coverage; this is not a model-ranking benchmark.')}</p>
    <div className="result-actions"><button className="primary" onClick={()=>onOpen(item.id)}>{zh?'在工作台打开':'Open in workbench'} ↗</button>{!single&&<><button onClick={()=>downloadPublicFile(`${item.id}_metrics.json`,JSON.stringify(item.metrics,null,2))}>{zh?'下载指标 JSON':'Metrics JSON'}</button><button onClick={()=>downloadPublicFile(`${item.id}_all_frames.csv`,metricCSV(item),'text/csv')}>{zh?'下载全部帧 CSV':'All-frame CSV'}</button></>}<button onClick={()=>downloadPublicFile(`${item.id}_dataset.json`,JSON.stringify({name:item.name,description:item.description,comparison:item.comparison,lattice:item.processing.lattice,sourceFrameRange:item.sourceFrameRange,publishedFrames:item.sampledFrames,limitations:item.limitations},null,2))}>{zh?'数据说明 JSON':'Dataset details JSON'}</button></div>
   </article>;
  })}</div>}
 </div></section>;
}
