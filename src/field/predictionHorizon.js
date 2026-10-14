export function predictionHorizon(row){
 if(!Number.isSafeInteger(row?.frame)||!Number.isSafeInteger(row?.prediction_origin_frame)||!Number.isFinite(row?.fps)||row.fps<=0)return null;
 if(row.prediction_type==='extrapolation'&&row.frame<=row.prediction_origin_frame)return null;
 const seconds=(row.frame-row.prediction_origin_frame)/row.fps;
 return Number.isFinite(seconds)?seconds:null;
}
