import React from 'react';
import {useI18n} from '../i18n.jsx';

const reasons={
 missing_or_nonfinite_column:['missing or non-finite column','缺失或非有限数值列'],
 no_interior_to_exterior_span:['no trustworthy interior-to-exterior span','缺少可信的水内至水外跨度'],
 ambiguous_or_multiple_crossings:['ambiguous or multiple surfaces','交叉不明确或存在多层水面'],
 crossing_touches_truncation:['crossing touches truncation boundary','交叉接触截断边界'],
 nonfinite_height:['non-finite height','高度不是有限数值'],
 nonfinite_difference:['non-finite height difference','高度差不是有限数值'],
 outside_common_columns:['outside common column support','不在共同有效列内']
};
const blockedReasons={
 'No paired trustworthy single-surface columns':'没有可配对的可信单层水面列。',
 'Invalid world-Y lattice':'世界 Y 轴网格无效。',
 'Invalid height input dimensions':'高度输入维度无效。',
 'Height column grids differ':'高度列网格不一致。',
 'Height requires full SDF or trusted TSDF; filled exterior/unknown is not a trustworthy zero crossing':'需要完整 SDF 或可信 TSDF；水外填值或类型未知无法提供可信零交叉。',
 'Height requires validated unchanged SDF distances':'需要经验证且未重建的 SDF 距离。',
 'Height requires axis-aligned world-Y-up lattice':'需要与世界坐标轴对齐、Y 轴向上的网格。',
 'Height requires a comparison with matching declared units':'需要 GT 与预测的声明单位一致。',
 'Height requires finite positive trusted truncation distance':'需要有限、正值且可信的截断距离。'
};
export default function HeightSupportAudit({data}){
 const {language}=useI18n(),zh=language==='zh';
 const label=key=>{const [role,...rest]=key.split(':'),code=rest.length?rest.join(':'):role;
  return (rest.length?(role==='gt'?'GT: ':role==='prediction'?(zh?'预测：':'Prediction: '):role+': '):'')+(reasons[code]?.[zh?1:0]??code);};
 return <details><summary>{zh?'当前帧高度有效区域与排除原因':'Current-frame height support and exclusions'}</summary>
 {!data?<p>{zh?'此帧没有高度记录。旧结果需重新创建比较；尚未载入的帧请先选择。':'No height record for this frame. Create a new comparison for legacy results, or select a loaded frame.'}</p>:<>
 {data.reason&&<p>{zh?(blockedReasons[data.reason]??data.reason):data.reason}</p>}
 {data.blocked&&<p>{zh?'此帧高度评分不可用；不能把未评估数量当作零。':'Height scoring unavailable for this frame; unevaluated counts are not zero.'}</p>}
 <table aria-label={zh?'高度有效区域明细':'Height support audit'}><thead><tr><th>{zh?'项目／原因':'Support / reason'}</th><th>{zh?'列数':'Columns'}</th></tr></thead><tbody>
 {[[zh?'有效配对列':'Valid paired columns','validColumns'],[zh?'GT 有效列':'Valid GT columns','gtValidColumns'],[zh?'候选水平列':'Candidate horizontal columns','candidateColumns']].map(([name,key])=><tr key={key}><th scope="row">{name}</th><td>{data.blocked||!Number.isFinite(data[key])?'N/A':data[key]}</td></tr>)}
 {Object.entries(data.excludedReasons??{}).map(([key,n])=><tr key={key}><th scope="row">{label(key)}</th><td>{Number.isFinite(n)?n:'N/A'}</td></tr>)}
 </tbody></table><p>{zh?'配对覆盖率＝配对列／GT 有效列；GT 可重建比例＝GT 有效列／候选列。排除原因不代表模型排名。':'Paired coverage = paired / valid GT columns; GT reconstructible fraction = valid GT / candidate columns. Exclusions are not model rankings.'}</p>
 </>}
 </details>;
}
