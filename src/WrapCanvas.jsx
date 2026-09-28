import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const W=2048,H=1024;
export const WrapCanvas = forwardRef(function WrapCanvas({layers,selectedId,onSelect,onChange,model,onTexture},ref){
  const canvas=useRef(null), drag=useRef(null);
  const draw=(selection=true)=>{const c=canvas.current,x=c.getContext("2d");x.fillStyle="#f8f8f4";x.fillRect(0,0,W,H);x.strokeStyle="#d7d9d2";x.lineWidth=2;for(let i=0;i<W;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}for(let i=0;i<H;i+=64){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke()}
    x.fillStyle="#20231f";x.font="600 25px sans-serif";x.fillText(`${model.toUpperCase()} / WRAP MAP`,48,55);x.fillStyle="#858a82";x.font="16px monospace";x.fillText("DRIVER SIDE",48,105);x.fillText("PASSENGER SIDE",48,535);
    x.setLineDash([12,8]);x.strokeStyle="#8e9489";x.strokeRect(42,125,W-84,330);x.strokeRect(42,555,W-84,330);x.setLineDash([]);
    x.globalAlpha=.25;x.fillStyle="#aeb3aa";x.beginPath();x.roundRect(90,205,1860,180,75);x.fill();x.beginPath();x.roundRect(90,635,1860,180,75);x.fill();x.globalAlpha=1;
    layers.forEach(l=>{if(!l.visible)return;x.save();x.globalAlpha=l.opacity;x.translate(l.x,l.y);x.rotate(l.rotation);x.drawImage(l.image,-l.width/2,-l.height/2,l.width,l.height);x.restore()});
    const s=layers.find(l=>l.id===selectedId);if(selection&&s){x.save();x.translate(s.x,s.y);x.rotate(s.rotation);x.strokeStyle="#151815";x.lineWidth=4;x.setLineDash([10,7]);x.strokeRect(-s.width/2,-s.height/2,s.width,s.height);x.setLineDash([]);x.fillStyle="#dfff36";for(const [px,py] of [[-s.width/2,-s.height/2],[s.width/2,-s.height/2],[-s.width/2,s.height/2],[s.width/2,s.height/2]]){x.fillRect(px-9,py-9,18,18);x.strokeRect(px-9,py-9,18,18)}x.restore()}
  };
  useEffect(()=>{draw();onTexture(canvas.current)},[layers,selectedId,model]);useImperativeHandle(ref,()=>({export(){draw(false);const url=canvas.current.toDataURL("image/png");draw();return url},element:canvas.current}));
  const point=e=>{const r=canvas.current.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
  const down=e=>{const p=point(e),hit=[...layers].reverse().find(l=>l.visible&&Math.abs(p.x-l.x)<l.width/2&&Math.abs(p.y-l.y)<l.height/2);onSelect(hit?.id||null);if(hit){drag.current={id:hit.id,dx:p.x-hit.x,dy:p.y-hit.y};canvas.current.setPointerCapture(e.pointerId)}};
  const move=e=>{if(!drag.current)return;const p=point(e);onChange(drag.current.id,{x:p.x-drag.current.dx,y:p.y-drag.current.dy})};
  return <canvas ref={canvas} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={()=>drag.current=null} className="block w-full touch-none shadow-2xl shadow-black/15" aria-label="2D wrap artwork editor"/>;
});
