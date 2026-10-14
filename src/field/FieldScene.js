import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export function createFieldScene(container,{onCameraChange,rendererFactory=()=>new THREE.WebGLRenderer({antialias:true}),controlsFactory=(camera,element)=>new OrbitControls(camera,element)}={}){
  const renderer=rendererFactory();container.appendChild(renderer.domElement);renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f4f8fb');
  const camera=new THREE.PerspectiveCamera(40,1,.001,100000);camera.position.set(8,6,9);
  const controls=controlsFactory(camera,renderer.domElement);controls.enableDamping=false;
  scene.add(new THREE.HemisphereLight(0xffffff,0x657589,2.4));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,8,5);scene.add(light);
  const axes=new THREE.AxesHelper(1);scene.add(axes);let grid=null,objects=[],settings={mode:'split',opacity:.65},disposed=false,width=1,height=1,autoRange=[0,1];
  function recolor(){const range=settings.sourceRange||autoRange;for(const o of objects){const values=o.userData.values;if(!values)continue;const colors=o.geometry.attributes.color;for(let i=0;i<values.length;i++){const t=Math.max(0,Math.min(1,(values[i]-range[0])/(range[1]-range[0]||1)));new THREE.Color().setHSL(.65*(1-t),.8,.48).toArray(colors.array,i*3)}colors.needsUpdate=true}}
  const clearObjects=()=>{for(const object of objects){scene.remove(object);object.geometry.dispose();object.material.dispose()}objects=[]};
  function styleObjects(){
    for(const o of objects){
      if(o.userData.kind==='slice-outline'){o.material.opacity=1;o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=4;continue;}
      const prediction=o.userData.role==='prediction';
      const wire=settings.mode==='wire-overlay'&&prediction&&o.userData.kind==='surface';
      o.renderOrder=wire?3:prediction?2:1;
      o.material.transparent=true;
      o.material.opacity=settings[prediction?'predictionOpacity':'gtOpacity']??settings.opacity;
      o.material.depthWrite=!['overlay','wire-overlay'].includes(settings.mode);
      if(o.isMesh){
        if(o.material.userData.xray!==wire){
          o.material.userData.xray=wire;
          // Screen-space gaps keep a dense wire layer from covering the GT.
          // Only raster appearance changes; sampled positions stay untouched.
          o.material.onBeforeCompile=shader=>{if(wire)shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\nif (mod(floor(gl_FragCoord.x / 3.0) + floor(gl_FragCoord.y / 3.0), 2.0) < 1.0) discard;');};
          o.material.customProgramCacheKey=()=>wire?'field-xray-gaps-1':'field-surface-1';
          o.material.needsUpdate=true;
        }
        o.material.wireframe=wire;
        // Transparent surfaces must not occlude the other layer's depth buffer.
        // X-ray wireframe is explicitly a comparison aid, not physical occlusion.
        o.material.depthTest=!wire;
      }
    }
  }
  function draw(){
    if(disposed)return;const roles=settings.mode==='split'?['gt','prediction']:[settings.mode==='gt'?'gt':settings.mode==='prediction'?'prediction':null];
    renderer.setScissorTest(true);
    roles.forEach((role,i)=>{const w=width/roles.length;camera.aspect=w/height;camera.updateProjectionMatrix();renderer.setViewport(i*w,0,w,height);renderer.setScissor(i*w,0,w,height);objects.forEach(o=>{o.visible=(!role||o.userData.role===role)&&settings[o.userData.role==='prediction'?'showPrediction':'showGt']!==false});renderer.render(scene,camera)});
  }
  const changed=()=>{draw();onCameraChange?.({position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom})};controls.addEventListener('change',changed);
  function resize(){width=Math.max(1,container.clientWidth);height=Math.max(1,container.clientHeight);renderer.setSize(width,height);draw()}
  const observer=globalThis.ResizeObserver?new ResizeObserver(resize):null;observer?.observe(container);
  const api={
    setGeometry(result){
      clearObjects();let low=Infinity,high=-Infinity;
      for(const layer of result?.layers||[])for(const v of layer.values||[]){low=Math.min(low,v);high=Math.max(high,v)}
      autoRange=[low,high];const range=settings.sourceRange||autoRange;
      for(const layer of result?.layers||[]){
        if(!layer.positions.length)continue;const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(layer.positions,3));
        const color=layer.role==='gt'?0x159cbb:0xed9852;let material,object;
        if(layer.values){const colors=new Float32Array(layer.values.length*3);for(let i=0;i<layer.values.length;i++){const t=Math.max(0,Math.min(1,(layer.values[i]-range[0])/(range[1]-range[0]||1)));const c=new THREE.Color().setHSL(.65*(1-t),.8,.48);c.toArray(colors,i*3)}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))}
        if(layer.kind==='vectors'||layer.kind==='slice-outline'){material=new THREE.LineBasicMaterial({vertexColors:!!layer.values,color:layer.kind==='slice-outline'?0x864dc4:layer.values?0xffffff:color});object=new THREE.LineSegments(geometry,material)}
        else {geometry.computeVertexNormals();material=new THREE.MeshStandardMaterial({color:layer.values?0xffffff:color,vertexColors:!!layer.values,side:THREE.DoubleSide,roughness:.7,transparent:true,opacity:layer.kind==='slice'?.85:settings.opacity,depthWrite:settings.mode!=='overlay'});object=new THREE.Mesh(geometry,material)}
        object.userData={role:layer.role,kind:layer.kind,values:layer.values};objects.push(object);scene.add(object);
      }styleObjects();draw();
    },
    setDisplay(value){const changedRange=JSON.stringify(settings.sourceRange)!==JSON.stringify(value.sourceRange);settings={...settings,...value};styleObjects();if(changedRange)recolor();draw()},
    setCamera(pose){camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);camera.zoom=pose.zoom;controls.update();draw()},
    getCamera(){return {position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom}},
    fit(bounds){if(!bounds)return;const center=new THREE.Vector3(...bounds.min).add(new THREE.Vector3(...bounds.max)).multiplyScalar(.5);const size=new THREE.Vector3(...bounds.max).sub(new THREE.Vector3(...bounds.min)).length()||1;camera.position.copy(center).add(new THREE.Vector3(.8,.65,.9).multiplyScalar(size));controls.target.copy(center);camera.near=size/10000;camera.far=size*100;camera.zoom=1;axes.scale.setScalar(size*.15);axes.position.copy(center);if(grid){scene.remove(grid);grid.geometry.dispose();grid.material.dispose()}grid=new THREE.GridHelper(size*1.3,12,0xcad9e4,0xe0eaf1);grid.position.set(center.x,bounds.min[1],center.z);scene.add(grid);controls.update();draw()},
    resize,
    dispose(){if(disposed)return;disposed=true;observer?.disconnect();controls.removeEventListener('change',changed);controls.dispose();clearObjects();for(const item of [axes,grid]){item?.geometry.dispose();if(Array.isArray(item?.material))item.material.forEach(m=>m.dispose());else item?.material.dispose()}renderer.dispose();renderer.domElement.remove()},
  };resize();return api;
}
