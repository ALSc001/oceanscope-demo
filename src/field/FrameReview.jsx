import React,{useMemo,useState} from 'react';
import {useI18n} from '../i18n.jsx';
import {reviewFrames,protocolCsv} from './frameReview.js';
import {formatMetric} from './sequenceMetrics.js';
export default function FrameReview({report,metric,onFrame,onDownload,comparisonId,frameSplit}){
 const {language,tr}=useI18n(),zh=language==='zh',t=(en,cn)=>zh?cn:en;
 const [threshold,setThreshold]=useState(.9);
 const review=useMemo(()=>reviewFrames(report.rows,metric,threshold),[report.rows,metric,threshold]);
 const items=(rows,kind)=>rows.slice(0,20).map(r=><li key={r.frame}><button disabled={!r.available||!onFrame} aria-label={`${kind==='unavailable'?'Review unavailable frame':kind==='coverage'?'Review coverage frame':'Review frame'} ${r.frame}`} onClick={()=>onFrame(r.frame)}>{r.frame}</button> · {kind==='coverage'?formatMetric(r.values[`${metric?.group}.coverage`]):formatMetric(r.values[metric?.id])}{kind==='unavailable'&&<span> · {r.reason||(!r.calculated?t('Not calculated / missing frame','尚未计算或帧缺失'):t('Metric unavailable on this support; see definitions below','该指标在当前有效区域不可用，请查看下方定义'))}</span>}</li>);
 return <details className="frame-review"><summary>{t('Frame review & report notes','异常帧检查与报告说明')}</summary>
  <p>{t('Review only: no frames are removed and no scores are changed. Lists follow the selected subset and metric. Worst does not mean statistically abnormal.','仅供检查：不剔除帧、不改变数值。列表跟随当前集合和指标；最差帧不等同于统计异常。')}</p>
  <div className="frame-review-grid"><section><h4>{t('Worst 5 frames','表现最差的 5 帧')} · {tr(metric?.label)}</h4>{review.worst.length?<ol>{items(review.worst,'worst')}</ol>:<p>{t('No rankable finite values. Coverage is context, not accuracy.','没有可排序的有效数值；覆盖率是背景信息，不代表精度。')}</p>}</section>
  <section><h4>{t('Low coverage','低覆盖率')} · {review.lowCoverage.length}</h4><label>{t('Review threshold','检查阈值')} <input aria-label="Coverage review threshold" type="number" min="0" max="1" step="0.05" value={threshold} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=0&&n<=1)setThreshold(n)}}/></label><small>{t('Below this fraction; review aid, not a scientific pass/fail criterion.','低于此比例时列出；仅辅助检查，不是科研合格线。')}</small><ul>{items(review.lowCoverage,'coverage')}</ul></section>
  <section><h4>{t('Unavailable metric','指标不可用')} · {review.unavailable.length}</h4><ul>{items(review.unavailable,'unavailable')}</ul><small>{t('At most 20 entries per list; all values remain in the frame table and CSV.','每个列表最多显示 20 项，全部数据仍保留在逐帧表格和 CSV。')}</small></section></div>
  <details><summary>{t('How to interpret these results','如何解读这些结果')}</summary><ul>
   <li>{t('N/A is not zero: it may mean missing frames, blocked scoring, no valid samples, or an unsupported metric. The list gives known blocking reasons; metric definitions explain other restrictions.','N/A 不是零：可能是缺帧、计算被阻止、无有效样本或指标不适用。列表显示已知阻止原因，其余限制见指标定义。')}</li>
   <li>{t('A lower error with lower coverage is not automatically better. Compare models on matching frames and common spatial support.','误差更低但覆盖率更低，不自动代表更好。模型比较应使用匹配帧和共同有效空间区域。')}</li>
   <li>{t('Exterior-filled SDF supports conditional interior distance errors only; it does not certify full-domain distance accuracy. Surface metrics may be unavailable.','水外固定填值的 SDF 只支持有条件的水内距离误差，不能证明全域距离精度；表面指标可能不可用。')}</li>
   <li>{t('SDF MAE is not wave-height MAE. Sequence means give equal weight to valid frames, not to pooled voxels.','SDF MAE 不等于浪高 MAE。序列均值对有效帧等权，并非将所有体素合并计算。')}</li>
  </ul></details>
  <button disabled={!report.total} onClick={()=>onDownload(`${comparisonId}_${report.frameSubset}_report_notes.csv`,protocolCsv(report,comparisonId,frameSplit))}>{t('Export report notes CSV','导出报告说明 CSV')}</button>
 </details>;
}
