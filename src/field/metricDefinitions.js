const sdfDomain='Common valid finite SDF voxels M; N = |M|. Interior means SDF ≤ 0.';
const velDomain='Common valid finite velocity voxels M; not automatically restricted to fluid interior.';
const entry=(id,label,formula,unitKind,direction,group,domain,caveats='')=>({id,label,formula,unitKind,direction,group,domain,caveats});
export const METRIC_DEFINITIONS=[
  entry('mae','Water-surface elevation MAE','mean |ηp − ηg|','length','Lower','elevation','Paired trustworthy world-Y zero-crossing columns on common XZ lattice.','Not crest-to-trough wave height or Hs. Filled exterior, missing support and multiple crossings are excluded; inspect both coverage denominators.'),
  entry('rmse','Water-surface elevation RMSE','sqrt(mean (ηp − ηg)^2)','length','Lower','elevation','Same paired height columns.','Full-resolution aligned SDF, never preview mesh.'),
  entry('maxAbsoluteError','Maximum elevation error','max |ηp − ηg|','length','Lower','elevation','Same paired height columns.'),
  entry('coverage','Height paired coverage','paired valid columns / GT valid columns','fraction','Context','elevation','GT reconstructible columns.','Zero denominator: N/A. Not SDF voxel coverage.'),
  entry('gtCoverage','GT reconstructible coverage','GT valid columns / candidate XZ columns','fraction','Context','elevation','All candidate XZ columns.','Read with paired coverage to expose excluded GT surfaces.'),
  entry('mae','SDF MAE','Σ |p − g| / N','length','Lower','sdf',sdfDomain,'Full/full distances, or explicitly labeled conditional interior distances. For filled exteriors, exclude unsupported distances and interpret with GT-water coverage and occupancy metrics.'),
  entry('rmse','SDF RMSE','√(Σ (p − g)² / N)','length','Lower','sdf',sdfDomain,'Full/full distances, or explicitly labeled conditional interior distances. For filled exteriors, exclude unsupported distances and interpret with GT-water coverage and occupancy metrics.'),
  entry('maxAbsoluteError','Maximum absolute error','max |p − g|','length','Lower','sdf',sdfDomain,'Full/full distances, or explicitly labeled conditional interior distances. For filled exteriors, exclude unsupported distances and interpret with GT-water coverage and occupancy metrics.'),
  entry('nearSurfaceMae','Near-surface MAE','mean |clipτ(p) − clipτ(g)| on B','length','Lower','sdf','B = M ∩ {|g| ≤ effective band}, including numerical tolerance.','GT defines B. For TSDF, band ≤ shared τ; clip both values at τ. Shared τ is min of both TSDF τ values, or the single TSDF τ in a mixed pair. No clipping for full/full.'),
  entry('signAccuracy','Sign accuracy','count[(p ≤ 0) = (g ≤ 0)] / N','fraction','Higher','sdf',sdfDomain),
  entry('fluidIoU','Fluid IoU','|P ∩ G| / |P ∪ G|','fraction','Higher','sdf',sdfDomain,'P and G are predicted and GT interior sets in M. Both empty: 1.'),
  entry('dice','Dice','2 |P ∩ G| / (|P| + |G|)','fraction','Higher','sdf',sdfDomain,'Both interior sets empty: 1.'),
  entry('symmetricMeanSurfaceDistance','Symmetric mean surface distance','mean(D(G→P) ∪ D(P→G))','length','Lower','sdf','Pooled nearest distances between sampled zero crossings; each surface uses its own valid support.','Approximation, at most 4096 samples per surface. Not exact continuous-mesh distance; unavailable if either surface is empty.'),
  entry('hd95','HD95','percentile95(D(G→P) ∪ D(P→G))','length','Lower','sdf','Same pooled sampled-surface distances.','Linear percentile interpolation; not maximum Hausdorff distance. Surface-sampling limitations apply.'),
  entry('meanEpe','Mean EPE','mean ‖p − g‖₂','speed','Lower','velocity',velDomain),
  entry('epeRmse','EPE RMSE','√mean ‖p − g‖₂²','speed','Lower','velocity',velDomain),
  entry('epeP95','EPE P95','percentile95(‖p − g‖₂)','speed','Lower','velocity',velDomain,'Linear interpolation between ordered samples.'),
  entry('componentMae','Component MAE (x, y, z)','mean |pₖ − gₖ|, k = x,y,z','speed','Lower','velocity',velDomain),
  entry('componentRmse','Component RMSE (x, y, z)','√mean (pₖ − gₖ)², k = x,y,z','speed','Lower','velocity',velDomain),
  entry('relativeL2','Relative L2','√(Σ ‖p − g‖₂² / Σ ‖g‖₂²)','dimensionless','Lower','velocity',velDomain,'Unavailable when GT energy is zero; no artificial epsilon in denominator.'),
  entry('meanCosineSimilarity','Mean cosine similarity','mean clamp((p·g)/(‖p‖₂ ‖g‖₂), −1, 1)','dimensionless','Higher','velocity',velDomain,'Exclude either magnitude ≤ ε (default 1e−8).'),
  entry('meanAngularErrorDegrees','Mean angular error','mean acos(cosine) × 180/π','degrees','Lower','velocity',velDomain,'Same nonzero-vector subset as cosine similarity.'),
  entry('divergenceMae','Divergence MAE','mean |∇·p − ∇·g|','inverseTime','Lower','velocity','Six valid neighboring samples; finite central-difference divergence. Borders excluded.','Σₖ (vₖ(i+eₖ) − vₖ(i−eₖ))/(2hₖ). Orthogonal aligned lattice. Divergence mismatch, not absolute incompressibility.'),
  entry('coverage','Coverage','N / total lattice voxels','fraction','Context','both','Reported separately for SDF and velocity.','Always read with the error: small valid support can hide missing predictions.'),
];
export function getMetricAvailability(id,{sdfKinds=[],metrics}={}){
  if(metrics?.blocked)return {available:false,reason:metrics.reason||'Declare semantics and units.'};
  if(['mae','rmse','maxAbsoluteError'].includes(id)&&!metrics?.conditionalDistanceEnabled&&(sdfKinds.some(k=>k!=='full')||metrics?.globalDistanceEnabled===false))return {available:false,reason:'Global distance metrics require full SDF versus full SDF.'};
  const value=metrics?.[id];if(value==null)return {available:false,reason:id==='relativeL2'?'Unavailable: no valid samples or zero GT energy.':'Unavailable for this frame/support; never substituted with zero.'};
  return {available:true,reason:''};
}
export function exportMetricGlossary(){return {schema:1,notation:'g = Ground Truth; p = Prediction. These are evaluation metrics, not a weighted training loss.',sequence:'Equal weight per valid frame, not pooled voxels. Excluded frame counts are reported. Population standard deviation; interpolated P95.',metrics:METRIC_DEFINITIONS}}
