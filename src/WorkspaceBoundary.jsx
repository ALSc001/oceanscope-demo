import React from 'react';
export default class WorkspaceBoundary extends React.Component{
 state={error:null};
 static getDerivedStateFromError(error){return {error}}
 render(){return this.state.error?<section className="startup-card" role="alert">
  <h2>页面暂时无法显示 / Unable to display this workspace</h2>
  <p>缓存与已保存结果未被删除。可切换上方其他页面，或刷新重试。 / Saved results are unchanged.</p>
  <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error.message||this.state.error)}</pre>
  <button onClick={()=>window.location.reload()}>刷新重试 / Reload</button>
 </section>:this.props.children}
}
