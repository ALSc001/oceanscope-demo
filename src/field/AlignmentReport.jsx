import {useI18n} from '../i18n.jsx';
import React from 'react';

export default function AlignmentReport({lattice,comparison}){
 const {tr}=useI18n();

  return <details className="alignment-report"><summary>{tr("Alignment and provenance")}</summary><dl><div><dt>{tr("Comparison")}</dt><dd>{comparison?.id||'—'}</dd></div><div><dt>{tr("Canonical lattice")}</dt><dd>{lattice?.dimensions?.join(' × ')||'—'}{tr(" voxels")}</dd></div><div><dt>{tr("Voxel size")}</dt><dd>{lattice?.voxelSize?.map(value=>Number(value).toPrecision(4)).join(' × ')||'—'}</dd></div><div><dt>{tr("Policy")}</dt><dd>{tr("Prediction sampled in world space onto Ground Truth voxel centres.")}</dd></div></dl></details>;
}
