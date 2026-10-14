import React,{useEffect,useRef} from 'react';

const clamp=value=>Math.max(0,Math.min(1,value));
const mix=(left,right,t)=>left.map((value,index)=>Math.round(value+(right[index]-value)*t));

function color(value,range,palette){
  const [minimum,maximum]=range;
  const normalized=maximum===minimum ? (palette==='error'?.5:0) : clamp((value-minimum)/(maximum-minimum));
  if(palette==='error')return normalized<.5?mix([32,91,177],[246,248,250],normalized*2):mix([246,248,250],[201,66,55],(normalized-.5)*2);
  if(palette==='prediction')return mix([255,244,221],[224,119,32],normalized);
  if(palette==='absolute-error')return mix([246,240,252],[103,32,150],normalized);
  return mix([235,244,252],[31,111,176],normalized);
}

export default function SliceCanvas({slice,maskSlice,range,palette='ground-truth',crosshair,onCrosshair,plane,aspect}){
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas||!slice)return;
    canvas.width=slice.width;canvas.height=slice.height;
    const context=canvas.getContext?.('2d');if(!context)return;
    const image=context.createImageData(slice.width,slice.height);
    for(let row=0;row<slice.height;row+=1){
      for(let column=0;column<slice.width;column+=1){
        const source=column+slice.width*row,target=4*(column+slice.width*(slice.height-1-row));
        const valid=!maskSlice||Boolean(maskSlice.values[source]);
        const value=slice.values[source];
        const rgb=valid&&Number.isFinite(value)?color(value,range,palette):((column+row)%6<3?[205,213,219]:[238,242,245]);
        image.data[target]=rgb[0];image.data[target+1]=rgb[1];image.data[target+2]=rgb[2];image.data[target+3]=255;
      }
    }
    context.putImageData(image,0,0);
    if(slice.components){
      context.strokeStyle=palette==='prediction'?'#7c3f0d':'#123e68';context.lineWidth=Math.max(1,slice.width/180);
      const axes=plane==='xy'?[0,1]:plane==='xz'?[0,2]:[1,2];
      const step=Math.max(4,Math.ceil(Math.max(slice.width,slice.height)/18));
      for(let row=step/2;row<slice.height;row+=step)for(let column=step/2;column<slice.width;column+=step){
        const index=Math.floor(column)+slice.width*Math.floor(row);if(maskSlice&&!maskSlice.values[index])continue;
        const vx=slice.components[axes[0]][index],vy=slice.components[axes[1]][index];
        const magnitude=Math.hypot(vx,vy);if(!Number.isFinite(magnitude)||magnitude<1e-8)continue;
        const length=Math.min(step*.42,step*.18+Math.log1p(magnitude)*step*.08),dx=vx/magnitude*length,dy=-vy/magnitude*length;
        const screenY=slice.height-1-row;
        context.beginPath();context.moveTo(column,screenY);context.lineTo(column+dx,screenY+dy);
        context.lineTo(column+dx-dx*.35+dy*.25,screenY+dy-dy*.35-dx*.25);
        context.moveTo(column+dx,screenY+dy);context.lineTo(column+dx-dx*.35-dy*.25,screenY+dy-dy*.35+dx*.25);context.stroke();
      }
    }
    if(crosshair){
      const x=crosshair[0]*slice.width,y=(1-crosshair[1])*slice.height;
      context.strokeStyle='#111';context.lineWidth=Math.max(.5,slice.width/350);context.setLineDash([3,3]);
      context.beginPath();context.moveTo(x,0);context.lineTo(x,slice.height);context.moveTo(0,y);context.lineTo(slice.width,y);context.stroke();context.setLineDash([]);
    }
  },[slice,maskSlice,range,palette,crosshair,plane]);
  return <canvas ref={ref} className="slice-canvas" style={{aspectRatio:aspect||'auto',height:'auto'}} onClick={event=>{
    if(!slice||!onCrosshair)return;const bounds=event.currentTarget.getBoundingClientRect();
    onCrosshair([clamp((event.clientX-bounds.left)/bounds.width),clamp(1-(event.clientY-bounds.top)/bounds.height)]);
  }}/>;
}
