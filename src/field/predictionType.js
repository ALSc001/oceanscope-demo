import {frameDeclaration} from './frameMembership.js';
export function predictionType(manifest,frame){const v=frameDeclaration(manifest,frame)?.prediction_type;return ['anchor','interpolation','extrapolation'].includes(v)?v:'unassigned'}
export function predictionTypeLabel(type,zh=false){return (zh?{anchor:'Anchor · 来源帧',interpolation:'时间插值',extrapolation:'未来外推',unassigned:'预测类型未声明'}:{anchor:'Anchor',interpolation:'Interpolation',extrapolation:'Future extrapolation',unassigned:'Prediction type undeclared'})[type]}
