import React from 'react';
import {useI18n} from '../i18n.jsx';
import {frameMembership} from './frameMembership.js';
import './frameSplit.css';
import {predictionType,predictionTypeLabel} from './predictionType.js';
export default function FrameSplitBadge({manifest,frame}){
 const {language}=useI18n(),split=frameMembership(manifest,frame);
 const labels=language==='zh'?{train:'Train · 训练集',validation:'Validation · 验证集',test:'Test · 测试集',unassigned:'Unassigned · 未划分'}:{train:'Train',validation:'Validation',test:'Test',unassigned:'Unassigned'};
 return <><span aria-label="Frame split" className={`frame-split-badge split-${frame==null?'unassigned':split}`} title={language==='zh'?'依据此预测模型的 CSV 声明；并非独立核验训练历史':'Declared by this prediction model’s CSV; training history is not independently verified'}>{frame==null?'—':labels[split]}</span>{frame!=null&&<span className="frame-split-badge" aria-label="Prediction type">{predictionTypeLabel(predictionType(manifest,frame),language==='zh')}</span>}</>;
}
