import React,{useEffect,useState} from 'react';
import {useI18n} from './i18n.jsx';
import {readSession,writeSession} from './session.js';
import {loadPublicCases} from './publicData.js';
import ComparisonWorkbench from './field/ComparisonWorkbench.jsx';
import {registerPublicFieldCases} from './field/fieldApi.js';
import './public-field-demo.css';
function PublishedCase({item,active}){
 const {language}=useI18n(),zh=language==='zh';
 const [group,setGroup]=useState(()=>item.comparison.settings?.previewOnly&&item.comparison.availableGroups.includes('velocity')?'velocity':'sdf');
 const single=Boolean(item.comparison.settings?.previewOnly);
 const setup=<div className="public-field-provenance"><p>{item.description}</p><dl>
  <div><dt>Ground Truth</dt><dd>{item.comparison.labels?.gt?.displayName}</dd></div>
  <div><dt>Prediction</dt><dd>{single?(zh?'未提供；不计算误差':'Not included; no error scores'):item.comparison.labels?.prediction?.displayName}</dd></div>
  <div><dt>{zh?'可查看的三维帧':'Available 3D frames'}</dt><dd>{item.processing.frames.map(f=>f.frame).join(', ')}</dd></div>
  <div><dt>{zh?'数据语义':'Data semantics'}</dt><dd>{single?(zh?'单位未声明':'Units undeclared'):(zh?'条件性 GT 水体距离误差；外部填充值不参与距离评分':'Conditional GT-water distance scores; filled exterior excluded from distance scoring')}</dd></div>
 </dl></div>;
 return <ComparisonWorkbench comparison={item.comparison} processing={item.processing} activeGroup={group} onActiveGroup={setGroup} setup={setup} expectedFrames={Object.keys(item.metrics?.frames||{}).map(Number)} metricsOverride={item.metrics||null} readOnly active={active}/>;
}
export default function FieldSamples({request,active=true}){
 const {tr,language}=useI18n(),zh=language==='zh';
 const [manifest,setManifest]=useState(null),[selected,setSelected]=useState(''),[pending,setPending]=useState(''),[error,setError]=useState(''),[retry,setRetry]=useState(0),[chooser,setChooser]=useState(false);
 useEffect(()=>{let live=true;loadPublicCases().then(data=>{if(!live)return;registerPublicFieldCases(data.cases);setManifest(data);const saved=readSession('public-case')?.id;const id=data.cases.some(c=>c.id===saved)?saved:data.cases[0].id;setSelected(id);setPending(id);setError('')}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[retry]);
 useEffect(()=>{if(request?.id&&manifest?.cases.some(c=>c.id===request.id)){setSelected(request.id);setPending(request.id);setChooser(false)}},[request,manifest]);
 useEffect(()=>{if(selected)writeSession('public-case',{id:selected})},[selected]);
 const item=manifest?.cases.find(c=>c.id===selected),draft=manifest?.cases.find(c=>c.id===pending),single=item?.comparison.settings?.previewOnly;
 return <section className="public-field-demo" aria-label="Published field examples">
  <header><h1>{tr('Field Compare')} <span>— {zh?'SDF 与速度场':'SDF & velocity'}</span></h1><button onClick={()=>{setPending(selected);setChooser(v=>!v)}} aria-expanded={chooser}>{zh?'选择示例数据':'Choose sample data'}</button></header>
  {error?<div className="error" role="alert">{error} <button onClick={()=>setRetry(v=>v+1)}>{zh?'重试':'Retry'}</button></div>:!manifest?<p role="status">{zh?'正在加载示例…':'Loading samples…'}</p>:<>
   {chooser&&<section className="sample-setup" aria-label="Sample dataset selection"><div className="sample-setup-heading"><h2>{zh?'数据与对比设置':'Datasets & comparison setup'}</h2><p>{zh?'选择已发布的数据组合，打开已有分析结果。':'Choose a published dataset pair to open its existing analysis.'}</p></div>
    <label>{zh?'示例组合':'Published example'}<select aria-label="Published field example" value={pending} onChange={e=>setPending(e.target.value)}>{manifest.cases.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {draft&&<div className="sample-dataset-grid"><div className="sample-source"><span className="source-role">GROUND TRUTH</span><h3>{draft.comparison.labels?.gt?.displayName}</h3><p>{draft.comparison.availableGroups.join(' + ').toUpperCase()}</p><span>{zh?'可用':'Ready'}</span></div><div className="sample-source"><span className="source-role prediction">PREDICTION</span><h3>{draft.comparison.settings?.previewOnly?(zh?'无预测数据':'No prediction included'):draft.comparison.labels?.prediction?.displayName}</h3><p>{draft.comparison.settings?.previewOnly?(zh?'独立查看，不显示误差指标':'Standalone inspection without error metrics'):(zh?'已对齐的 SDF · 已保存的评分设置':'Aligned SDF · Saved scoring settings')}</p></div></div>}
    <div className="sample-actions"><span>{zh?'原始 VDB / ABC 上传和新计算仅限本地版。':'Raw VDB / ABC import and new processing require the local app.'}</span><button onClick={()=>setChooser(false)}>{zh?'取消':'Cancel'}</button><button className="primary" onClick={()=>{setSelected(pending);setChooser(false)}}>{draft?.comparison.settings?.previewOnly?(zh?'查看 Ground Truth':'View Ground Truth'):(zh?'打开已有对比':'Open saved comparison')}</button></div>
   </section>}
   {item&&<><div className="case-strip"><strong>{item.name}</strong><span>{item.processing.frames.length} {zh?'个三维帧':'3D frames'}{!single&&` · ${Object.keys(item.metrics.frames).length} ${zh?'条已有指标记录':'saved metric records'}`}</span><details><summary>{zh?'数据范围':'Dataset scope'}</summary><p>{item.description}</p><p>{zh?'三维播放仅访问已发布帧；不会插值缺失帧。':'3D playback visits published frames only; missing frames are not interpolated.'}</p>{manifest.limitations.map((s,i)=><p key={i}>{s}</p>)}</details></div><PublishedCase key={item.id} item={item} active={active}/></>}
  </>}
 </section>;
}
