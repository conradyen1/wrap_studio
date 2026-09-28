import { containSize, fileStem, pointInLayer, rotatedPoint } from "./core.js";

const canvas = document.querySelector("#editorCanvas");
const ctx = canvas.getContext("2d");
const $ = (selector) => document.querySelector(selector);
const models = {
  model3: { name: "MODEL 3", meta: "Sedan · 4 panels", roof: 0.82, wheelbase: 1 },
  modely: { name: "MODEL Y", meta: "Crossover · 4 panels", roof: 1.04, wheelbase: 1 },
  models: { name: "MODEL S", meta: "Sedan · 4 panels", roof: 0.78, wheelbase: 1.08 },
  modelx: { name: "MODEL X", meta: "SUV · 4 panels", roof: 1.08, wheelbase: 1.06 },
  cybertruck: { name: "CYBERTRUCK", meta: "Utility · 4 panels", roof: 0.92, wheelbase: 1.12, angular: true },
};
let modelKey = "model3";
let layers = [];
let selectedId = null;
let interaction = null;
let zoom = 1;
let toastTimer;

function drawTemplate() {
  const model = models[modelKey];
  ctx.fillStyle = "#faf9f4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d7d7d0";
  ctx.lineWidth = 2;
  for (let x = 0; x <= canvas.width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y <= canvas.height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.fillStyle = "#737870";
  ctx.font = "22px DM Mono, monospace";
  ctx.fillText(`${model.name}  /  CUSTOM WRAP TEMPLATE`, 65, 62);
  ctx.font = "14px DM Mono, monospace";
  ctx.fillStyle = "#a1a49d";
  ctx.fillText("SIDE PROFILE", 65, 112);

  const x = 100, y = 210, w = 1400, h = 430, roof = model.roof;
  ctx.save();
  ctx.beginPath();
  if (model.angular) {
    ctx.moveTo(x + 20, y + h - 75); ctx.lineTo(x + 100, y + 170); ctx.lineTo(x + 530, y + 155 - 110 * roof); ctx.lineTo(x + 850, y + 45); ctx.lineTo(x + 1210, y + 160); ctx.lineTo(x + w - 25, y + 225); ctx.lineTo(x + w, y + h - 55); ctx.lineTo(x, y + h - 55); ctx.closePath();
  } else {
    ctx.moveTo(x, y + h - 80); ctx.quadraticCurveTo(x + 20, y + 210, x + 120, y + 190); ctx.lineTo(x + 400, y + 155); ctx.quadraticCurveTo(x + 540, y + 30 - 70 * roof, x + 770, y + 30); ctx.quadraticCurveTo(x + 1020, y + 25, x + 1180, y + 170); ctx.lineTo(x + 1360, y + 210); ctx.quadraticCurveTo(x + w, y + 225, x + w, y + h - 65); ctx.lineTo(x, y + h - 65); ctx.closePath();
  }
  ctx.fillStyle = "#eeeee8"; ctx.fill(); ctx.strokeStyle = "#353934"; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 440, y + 165); ctx.lineTo(x + 565, y + 64); ctx.lineTo(x + 775, y + 54); ctx.lineTo(x + 930, y + 165); ctx.closePath(); ctx.fillStyle = "#cfd1cb"; ctx.fill(); ctx.strokeStyle="#888c85";ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+787,y+54);ctx.lineTo(x+1160,y+170);ctx.lineTo(x+945,y+165);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="#8e928b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+760,y+180);ctx.lineTo(x+760,y+h-70);ctx.moveTo(x+1010,y+180);ctx.lineTo(x+1030,y+h-70);ctx.stroke();
  for (const wx of [x + 310, x + 1165]) { ctx.beginPath();ctx.arc(wx,y+h-58,92,0,Math.PI*2);ctx.fillStyle="#faf9f4";ctx.fill();ctx.strokeStyle="#353934";ctx.lineWidth=24;ctx.stroke();ctx.beginPath();ctx.arc(wx,y+h-58,37,0,Math.PI*2);ctx.strokeStyle="#a5a8a1";ctx.lineWidth=6;ctx.stroke(); }
  ctx.setLineDash([15, 10]);ctx.strokeStyle="#b2b5ae";ctx.lineWidth=3;ctx.strokeRect(x+40,y+22,w-80,h-48);ctx.setLineDash([]);ctx.restore();
  ctx.font="13px DM Mono, monospace";ctx.fillStyle="#9a9d96";ctx.fillText("PRINTABLE SAFE AREA",x+55,y+52);
  ctx.fillText("FRONT", 1430, 675);ctx.fillText("REAR", 105, 675);
  ctx.strokeStyle="#bbbdb6";ctx.beginPath();ctx.moveTo(65,750);ctx.lineTo(1535,750);ctx.stroke();
  ctx.fillStyle="#a1a49d";ctx.font="14px DM Mono, monospace";ctx.fillText("TOP / HOOD PANELS",65,795);
  ctx.strokeStyle="#4c504a";ctx.lineWidth=4;roundedRect(ctx,160,830,430*model.wheelbase,105,35);ctx.stroke();roundedRect(ctx,650,830,290,105,45);ctx.stroke();roundedRect(ctx,1000,830,430*model.wheelbase,105,35);ctx.stroke();
}

function roundedRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function drawLayer(layer) {
  if (!layer.visible) return;
  ctx.save();ctx.translate(layer.x,layer.y);ctx.rotate(layer.rotation);ctx.globalAlpha=layer.opacity;ctx.drawImage(layer.image,-layer.width/2,-layer.height/2,layer.width,layer.height);ctx.restore();
}
function drawSelection(layer) {
  if (!layer || !layer.visible) return;
  ctx.save();ctx.translate(layer.x,layer.y);ctx.rotate(layer.rotation);ctx.strokeStyle="#161916";ctx.lineWidth=3;ctx.setLineDash([9,6]);ctx.strokeRect(-layer.width/2,-layer.height/2,layer.width,layer.height);ctx.setLineDash([]);
  ctx.fillStyle="#d9ff43";ctx.strokeStyle="#161916";ctx.lineWidth=3;
  for(const [x,y] of [[-layer.width/2,-layer.height/2],[layer.width/2,-layer.height/2],[-layer.width/2,layer.height/2],[layer.width/2,layer.height/2]]){ctx.fillRect(x-9,y-9,18,18);ctx.strokeRect(x-9,y-9,18,18)}
  ctx.beginPath();ctx.moveTo(0,-layer.height/2);ctx.lineTo(0,-layer.height/2-55);ctx.stroke();ctx.beginPath();ctx.arc(0,-layer.height/2-65,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}
function render(includeSelection=true){drawTemplate();layers.forEach(drawLayer);if(includeSelection)drawSelection(getSelected())}
function getSelected(){return layers.find(l=>l.id===selectedId)}
function canvasPoint(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height}}

function addFiles(fileList) {
  [...fileList].filter(f=>f.type.startsWith("image/")).forEach((file,index)=>{
    const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const size=containSize(img.width,img.height,600,350);const layer={id:crypto.randomUUID(),name:file.name,image:img,url,x:800+index*25,y:420+index*25,width:size.width,height:size.height,baseWidth:size.width,baseHeight:size.height,rotation:0,opacity:1,visible:true};layers.push(layer);selectedId=layer.id;updateUI();render();};img.src=url;
  });
}
function updateUI(){
  $("#layerCount").textContent=`${layers.length} layer${layers.length===1?"":"s"}`;$("#canvasEmpty").hidden=layers.length>0;
  $("#layerList").innerHTML=layers.length?layers.slice().reverse().map(l=>`<div class="layer-item ${l.id===selectedId?"active":""}" data-id="${l.id}"><img class="layer-thumb" src="${l.url}" alt=""><div class="layer-copy"><strong>${escapeHTML(l.name)}</strong><span>Image layer</span></div><button class="visibility" aria-label="Toggle visibility">${l.visible?"◉":"○"}</button></div>`).join(""):'<div class="empty-layers">Your image layers will appear here.</div>';
  const selected=getSelected();$("#controls").hidden=!selected;$("#noSelection").hidden=!!selected;
  if(selected){$("#selectedName").textContent=selected.name;$("#scaleRange").value=Math.round(selected.width/selected.baseWidth*100);$("#scaleValue").textContent=`${$("#scaleRange").value}%`;$("#rotationRange").value=Math.round(selected.rotation*180/Math.PI);$("#rotationValue").textContent=`${$("#rotationRange").value}°`;$("#opacityRange").value=Math.round(selected.opacity*100);$("#opacityValue").textContent=`${$("#opacityRange").value}%`;}
}
function escapeHTML(value){const node=document.createElement("div");node.textContent=value;return node.innerHTML}

canvas.addEventListener("pointerdown",e=>{const p=canvasPoint(e);const selected=getSelected();if(selected){const rotatePoint=rotatedPoint({x:selected.x,y:selected.y-selected.height/2-65},{x:selected.x,y:selected.y},selected.rotation);if(Math.hypot(p.x-rotatePoint.x,p.y-rotatePoint.y)<28){interaction={type:"rotate",start:p};canvas.setPointerCapture(e.pointerId);return}const local=rotatedPoint(p,{x:selected.x,y:selected.y},-selected.rotation);if(Math.abs(Math.abs(local.x-selected.x)-selected.width/2)<25&&Math.abs(Math.abs(local.y-selected.y)-selected.height/2)<25){interaction={type:"resize",ratio:selected.baseWidth/selected.baseHeight};canvas.setPointerCapture(e.pointerId);return}}
  const hit=[...layers].reverse().find(l=>l.visible&&pointInLayer(p,l));selectedId=hit?.id||null;interaction=hit?{type:"move",offsetX:p.x-hit.x,offsetY:p.y-hit.y}:null;updateUI();render();if(hit)canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",e=>{if(!interaction)return;const p=canvasPoint(e),l=getSelected();if(!l)return;if(interaction.type==="move"){l.x=p.x-interaction.offsetX;l.y=p.y-interaction.offsetY}else if(interaction.type==="resize"){const local=rotatedPoint(p,{x:l.x,y:l.y},-l.rotation);l.width=Math.max(40,Math.abs(local.x-l.x)*2);l.height=l.width/interaction.ratio}else if(interaction.type==="rotate"){l.rotation=Math.atan2(p.y-l.y,p.x-l.x)+Math.PI/2}updateUI();render()});
canvas.addEventListener("pointerup",()=>interaction=null);canvas.addEventListener("pointercancel",()=>interaction=null);
$("#fileInput").addEventListener("change",e=>{addFiles(e.target.files);e.target.value=""});
const zone=$("#uploadZone");for(const type of ["dragenter","dragover"]){zone.addEventListener(type,e=>{e.preventDefault();zone.classList.add("dragging")})}for(const type of ["dragleave","drop"]){zone.addEventListener(type,e=>{e.preventDefault();zone.classList.remove("dragging");if(type==="drop")addFiles(e.dataTransfer.files)})}
$("#layerList").addEventListener("click",e=>{const item=e.target.closest(".layer-item");if(!item)return;const l=layers.find(x=>x.id===item.dataset.id);if(e.target.closest(".visibility"))l.visible=!l.visible;selectedId=l.id;updateUI();render()});
$("#modelSelect").addEventListener("change",e=>{modelKey=e.target.value;const m=models[modelKey];$("#modelCardName").textContent=m.name;$("#modelMeta").textContent=m.meta;$("#canvasTitle").textContent=`${m.name} / WRAP TEMPLATE`;render()});
for(const [id,prop,convert,suffix] of [["scaleRange","width",v=>getSelected().baseWidth*v/100,"%"],["rotationRange","rotation",v=>v*Math.PI/180,"°"],["opacityRange","opacity",v=>v/100,"%"]]){$(`#${id}`).addEventListener("input",e=>{const l=getSelected(),v=Number(e.target.value);l[prop]=convert(v);if(prop==="width")l.height=l.baseHeight*v/100;$(`#${id.replace("Range","Value")}`).textContent=`${v}${suffix}`;render()})}
$("#deleteLayer").addEventListener("click",()=>{const i=layers.findIndex(l=>l.id===selectedId);if(i<0)return;URL.revokeObjectURL(layers[i].url);layers.splice(i,1);selectedId=layers.at(-1)?.id||null;updateUI();render()});
$("#duplicate").addEventListener("click",()=>{const l=getSelected();if(!l)return;const copy={...l,id:crypto.randomUUID(),name:`${l.name} copy`,x:l.x+35,y:l.y+35};layers.push(copy);selectedId=copy.id;updateUI();render()});
$("#moveUp").addEventListener("click",()=>moveLayer(1));$("#moveDown").addEventListener("click",()=>moveLayer(-1));
function moveLayer(direction){const i=layers.findIndex(l=>l.id===selectedId),next=Math.max(0,Math.min(layers.length-1,i+direction));if(i===next)return;layers.splice(next,0,layers.splice(i,1)[0]);updateUI();render()}
function setZoom(next){zoom=Math.max(.6,Math.min(1.4,next));canvas.style.width=`min(${zoom*100}%, calc((100vh - 190px) * 1.6 * ${zoom}))`;$("#zoomLabel").textContent=`${Math.round(zoom*100)}%`}
$("#zoomIn").addEventListener("click",()=>setZoom(zoom+.1));$("#zoomOut").addEventListener("click",()=>setZoom(zoom-.1));
function download(){render(false);const link=document.createElement("a");link.download=`${fileStem(models[modelKey].name)}-custom-wrap.png`;link.href=canvas.toDataURL("image/png");link.click();render();showToast("Wrap exported successfully")}
$("#downloadButton").addEventListener("click",download);$("#exportTop").addEventListener("click",download);
function showToast(message){clearTimeout(toastTimer);$("#toast").textContent=message;$("#toast").classList.add("show");toastTimer=setTimeout(()=>$("#toast").classList.remove("show"),2200)}
window.addEventListener("keydown",e=>{if((e.key==="Delete"||e.key==="Backspace")&&getSelected()&&!e.target.matches("input"))$("#deleteLayer").click()});
render();updateUI();
