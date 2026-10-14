import React,{useState,useEffect,lazy,Suspense} from 'react';
import {LanguageProvider,useI18n} from './i18n.jsx';
import {readSession,writeSession} from './session.js';
import WorkspaceBoundary from './WorkspaceBoundary.jsx';
import './public-demo.css';
const SurfaceWorkspace=lazy(()=>import('./surface/SurfaceWorkspace.jsx'));
const FieldSamples=lazy(()=>import('./FieldSamples.jsx'));
const PublicResults=lazy(()=>import('./PublicResults.jsx'));
const PublicGuide=lazy(()=>import('./PublicGuide.jsx'));
export default function App(){return <LanguageProvider><Demo/></LanguageProvider>}
function Demo(){
 const {tr,language,setLanguage}=useI18n(),zh=language==='zh';
 const [page,setPage]=useState(()=>{const p=readSession('public-workspace')?.value;return ['surface','field','results','guide'].includes(p)?p:'surface'});
 const [visited,setVisited]=useState(()=>new Set([page]));
 const [fieldRequest,setFieldRequest]=useState(null);
 function open(next){setVisited(v=>new Set([...v,next]));setPage(next)}
 function openField(id){setFieldRequest({id,at:Date.now()});open('field')}
 useEffect(()=>{writeSession('public-workspace',{value:page});window.dispatchEvent(new Event('oceanscope-ready'))},[page]);
 return <div className="app-shell public-workbench">
  <nav className="workspace-switcher" aria-label="OceanScope workspace">
   <strong className="workbench-brand">OceanScope <span>{zh?'公开版':'PUBLIC'}</span></strong>
   {['surface','field','results','guide'].map((id,i)=><button key={id} aria-pressed={page===id} onClick={()=>open(id)}>{tr(['Wave Surface','Field Compare','Results Library','User Guide'][i])}</button>)}
   <div className="language-switch" role="group" aria-label="Language"><button lang="en" aria-pressed={!zh} onClick={()=>setLanguage('en')}>EN</button><button lang="zh-CN" aria-pressed={zh} onClick={()=>setLanguage('zh')}>中文</button></div>
  </nav>
  <div className="public-status"><span className="status-dot"/><span>{zh?'预置数据工作台 · 可交互分析与下载':'Sample-data workbench · Interactive analysis & downloads'}</span><button onClick={()=>open('guide')}>{zh?'上传与计算范围':'Upload & processing scope'} ↗</button></div>
  {visited.has('surface')&&<div className="workspace-layer" hidden={page!=='surface'}><WorkspaceBoundary><Suspense fallback={<Loading zh={zh}/>}><SurfaceWorkspace active={page==='surface'}/></Suspense></WorkspaceBoundary></div>}
  {visited.has('field')&&<div className="workspace-layer" hidden={page!=='field'}><WorkspaceBoundary><Suspense fallback={<Loading zh={zh}/>}><FieldSamples request={fieldRequest} active={page==='field'}/></Suspense></WorkspaceBoundary></div>}
  {page==='results'&&<WorkspaceBoundary><Suspense fallback={<Loading zh={zh}/>}><PublicResults onOpen={openField}/></Suspense></WorkspaceBoundary>}
  {page==='guide'&&<Suspense fallback={<Loading zh={zh}/>}><PublicGuide onOpen={open}/></Suspense>}
 </div>;
}
function Loading({zh}){return <section className="startup-card" role="status">{zh?'正在加载工作区…':'Loading workspace…'}</section>}
