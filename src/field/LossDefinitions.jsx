import {useI18n} from '../i18n.jsx';
import React from 'react';import {METRIC_DEFINITIONS,exportMetricGlossary} from './metricDefinitions.js';
export default function LossDefinitions({group='sdf'}){
 const {tr}=useI18n();

  function save(){const url=URL.createObjectURL(new Blob([JSON.stringify(exportMetricGlossary(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='OceanScope_metric_definitions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  return <details className="loss-definitions"><summary>{tr("Evaluation Metrics / Loss Definitions")}</summary><p>{tr("g = Ground Truth; p = Prediction. Evaluation metrics, not a weighted training loss.")}</p><p>{tr("Display quality never changes numerical metrics. Units follow dataset declarations; declaring units does not convert data.")}</p>{METRIC_DEFINITIONS.filter(m=>m.group===group||(m.group==='both'&&group!=='elevation')).map(m=><article key={m.id}><strong>{tr(m.label)}</strong><code>{m.formula}</code><small>{tr(m.direction)}{tr(" is better")}{m.direction==='Context'?tr(" (interpret with error)"):''} · {tr(m.unitKind)}</small><p>{tr(m.domain)} {tr(m.caveats)}</p></article>)}<p>{tr("Sequence statistics give equal weight to each valid frame, not each voxel. Missing values are excluded; valid/excluded frame counts are reported.")}</p><button onClick={save}>{tr("Export metric definitions")}</button></details>;
}
