import {useI18n} from './i18n.jsx';
import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {sectionSegments} from './analysis.js';

export default function MeshView({resource,datasetKey,axis,offset,reference,scale,colorMin,colorMax,wireframe,showSection,showHighestMarker=true}){
 const {tr,language}=useI18n();const zh=language==='zh';

  const host=useRef(),world=useRef(),marker=useRef();
  useEffect(()=>{
    const scene=new THREE.Scene();scene.background=new THREE.Color('#f5f8fb');
    const camera=new THREE.PerspectiveCamera(40,1,.01,1000);
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));host.current.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
    const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-3,10,7);scene.add(light);scene.add(new THREE.AmbientLight(0xffffff,1.2));
    world.current={scene,camera,renderer,controls,fitted:false};
    const resize=new ResizeObserver(()=>{if(!host.current)return;const {width,height}=host.current.getBoundingClientRect();if(width<=0||height<=0)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();});resize.observe(host.current);
    let anim;function tick(){controls.update();renderer.render(scene,camera);anim=requestAnimationFrame(tick)}tick();
    return()=>{cancelAnimationFrame(anim);resize.disconnect();controls.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  useEffect(()=>{
    if(!resource||!world.current)return;const w=world.current,g=resource.geometry.clone();
    const p=g.attributes.position,colors=new Float32Array(p.count*3),col=new THREE.Color();
    const stops=['#214bd6','#17b9d6','#37c7a0','#ead95e','#ef882d'].map(c=>new THREE.Color(c));
    for(let i=0;i<p.count;i++){const v=THREE.MathUtils.clamp(((p.getY(i)-reference)*scale-colorMin)/(colorMax-colorMin),0,1)*4;const n=Math.min(3,Math.floor(v));col.copy(stops[n]).lerp(stops[n+1],v-n);col.toArray(colors,i*3);}
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.72,metalness:0,wireframe});
    const mesh=new THREE.Mesh(g,material);w.scene.add(mesh);
    const box=g.boundingBox,center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.z);
    if(w.fitted!==datasetKey){w.camera.position.copy(center).add(new THREE.Vector3(span*.6,span*.85,span*1.05));w.camera.near=Math.max(.00001,span*.0001);w.camera.far=Math.max(100,span*50);w.camera.updateProjectionMatrix();w.controls.target.copy(center);w.fitted=datasetKey;}
    const grid=new THREE.GridHelper(Math.ceil(span*1.3),Math.ceil(span*1.3),0xb9c9d6,0xd9e3eb);grid.position.set(center.x,reference,center.z);grid.material.transparent=true;grid.material.opacity=.55;w.scene.add(grid);
    const labels=[];
    function label(text,position){
      const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.font='28px Segoe UI';ctx.fillStyle='#42617b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,32);
      const texture=new THREE.CanvasTexture(c),mat=new THREE.SpriteMaterial({map:texture,depthTest:false});const sprite=new THREE.Sprite(mat);sprite.position.copy(position);sprite.scale.set(span*.15,span*.0375,1);sprite.renderOrder=6;w.scene.add(sprite);labels.push(sprite);
    }
    const step=Math.max(1,Math.ceil(size.x/5));
    for(let x=Math.ceil(box.min.x/step)*step;x<=box.max.x;x+=step)label((x*scale).toFixed(1),new THREE.Vector3(x,reference,box.max.z+.3));
    label('X (m)',new THREE.Vector3(center.x,reference,box.max.z+.9));
    label('Z (m)',new THREE.Vector3(box.min.x-.5,reference,center.z));
    const sections=[];
    if(showSection){
      const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sectionSegments(g,axis,offset),3));
      const sm=new THREE.LineBasicMaterial({color:'#fdfefe',depthTest:false});const lines=new THREE.LineSegments(sg,sm);lines.renderOrder=4;w.scene.add(lines);sections.push(lines);
    }
    const highest=new THREE.Vector3();let y=-Infinity;
    for(let i=0;i<p.count;i++)if(p.getY(i)>y){y=p.getY(i);highest.fromBufferAttribute(p,i);}
    const dot=new THREE.Mesh(new THREE.SphereGeometry(span*.009,12,8),new THREE.MeshBasicMaterial({color:'#c5532d'}));dot.position.copy(highest);dot.visible=showHighestMarker;marker.current=dot;w.scene.add(dot);
    return()=>{if(marker.current===dot)marker.current=null;for(const o of [mesh,grid,dot,...sections]){w.scene.remove(o);o.geometry.dispose();o.material.dispose();}for(const o of labels){w.scene.remove(o);o.material.map.dispose();o.material.dispose();}};
  },[resource,datasetKey,axis,offset,reference,scale,colorMin,colorMax,wireframe,showSection]);
  useEffect(()=>{if(marker.current)marker.current.visible=showHighestMarker},[showHighestMarker]);
  function setCamera(view){
    const w=world.current;if(!w||!resource)return;const b=resource.geometry.boundingBox,c=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3()),span=Math.max(size.x,size.z);
    const direction=view==='top'?new THREE.Vector3(0,1.8,.001):view==='side'?new THREE.Vector3(0,.15,1.8):new THREE.Vector3(.6,.85,1.05);
    w.camera.position.copy(c).addScaledVector(direction,span);w.controls.target.copy(c);w.controls.update();
  }
  function snapshot(){const w=world.current;if(!w)return;w.renderer.render(w.scene,w.camera);const a=document.createElement('a');a.download=`oceanscope_${datasetKey}_view.png`;a.href=w.renderer.domElement.toDataURL('image/png');a.click()}
  return <div className="mesh-region"><div className="mesh-actions"><button disabled={!resource} onClick={()=>setCamera('reset')}>{zh?'重置视角':'Reset view'}</button><button disabled={!resource} onClick={()=>setCamera('top')}>{zh?'顶视图':'Top'}</button><button disabled={!resource} onClick={()=>setCamera('side')}>{zh?'侧视图':'Side'}</button><button disabled={!resource} onClick={snapshot}>{zh?'截图':'Snapshot'}</button></div><div ref={host} className="mesh-canvas"/><div className="canvas-help">{tr("Drag to orbit · Scroll to zoom · White line: true mesh section")}<br/>{showHighestMarker?tr("Orange marker: highest vertex of the displayed mesh"):tr("Highest-point marker hidden")}</div><div className="color-legend"><span>{tr("η (m)")}</span><div/><span>{colorMax.toFixed(2)}</span><span>{colorMin.toFixed(2)}</span></div></div>;
}
