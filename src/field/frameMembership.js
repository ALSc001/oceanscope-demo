export function frameDeclaration(manifest,frame){return frame==null?null:manifest instanceof Map?manifest.get(frame):manifest?.rows?.find(r=>r.frame===frame);}
export function frameMembership(manifest,frame){
 const row=frameDeclaration(manifest,frame);
 return ['train','validation','test'].includes(row?.split)?row.split:'unassigned';
}
export function matchesFrameSubset(manifest,frame,subset){
 const row=frameDeclaration(manifest,frame);
 if(subset==='all')return true;
 if(subset.startsWith('test_'))return row?.split==='test'&&(row.prediction_type||'unassigned')===subset.slice(5);
 return frameMembership(manifest,frame)===subset;
}
export function testTypeOptions(zh){return {test_interpolation:zh?'Test · 插值':'Test · Interpolation',test_extrapolation:zh?'Test · 未来外推':'Test · Future extrapolation',test_unassigned:zh?'Test · 类型未声明':'Test · Type undeclared',test_anchor:zh?'Test · Anchor':'Test · Anchor'};}
