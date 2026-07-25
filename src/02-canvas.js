// -----------------------------------
// SCREEN
// -----------------------------------
function setScreen(t){const s=st();if(!s)return;s.screenType=t;const d=SCDEF[t];s.screenW=d.w;s.screenH=d.h;s.screens=[{id:1,name:'Tela 1',type:'page',w:d.w,h:d.h}];applyCS();buildSdivs();buildScrPanel();['desktop','mobile'].forEach(id=>document.getElementById('btn-'+id).classList.toggle('on',id===t));document.getElementById('btn-custom').classList.remove('on');document.getElementById('sz').textContent=cW()+' x '+cH();saveLs();fitCanvas();}
function openCustomSize(){openM('Custom',`<label>Largura</label><input id="cw" type="number" value="${st()?.screenW||1920}"><label>Altura</label><input id="ch" type="number" value="${st()?.screenH||1080}">`,()=>{const s=st();if(!s)return;s.screenW=parseInt(document.getElementById('cw').value)||1920;s.screenH=parseInt(document.getElementById('ch').value)||1080;s.screens.forEach(sc=>{if(sc.type==='scroll-h')sc.w=sc.w||s.screenW;else sc.h=sc.h||s.screenH;});applyCS();buildSdivs();buildScrPanel();document.getElementById('sz').textContent=cW()+' x '+cH();document.getElementById('btn-custom').classList.add('on');saveLs();fitCanvas();});}
function addScreen(){openM('Nova Tela',`<label>Nome</label><input id="sn" placeholder="Pagina 2"><label>Tipo</label><select id="st"><option value="page">Pagina</option><option value="scroll-v">Rolagem vertical</option><option value="scroll-h">Rolagem horizontal</option></select><label>Tamanho (px)</label><input id="sh" type="number" value="${st()?.screenH||1080}"><p style="color:var(--muted);font-size:10px;margin-top:6px">Em rolagem horizontal, tamanho vira largura.</p>`,()=>{const s=st();if(!s)return;const type=document.getElementById('st').value,dim=parseInt(document.getElementById('sh').value)||s.screenH;s.screens.push({id:Date.now(),name:document.getElementById('sn').value||'Nova Tela',type,w:type==='scroll-h'?dim:s.screenW,h:type==='scroll-h'?s.screenH:dim});applyCS();buildSdivs();buildScrPanel();document.getElementById('sz').textContent=cW()+' x '+cH();saveLs();toast('Tela adicionada');});}
function delScreen(id){const s=st();if(!s||s.screens.length<=1){toast('Minimo uma tela');return;}s.screens=s.screens.filter(sc=>sc.id!==id);applyCS();buildSdivs();buildScrPanel();saveLs();}
function duplicateScreen(){const s=st();if(!s)return;const base=s.screens[s.screens.length-1]||{name:'Tela',type:'page',h:s.screenH};s.screens.push({...base,id:Date.now(),name:base.name+' copy'});applyCS();buildSdivs();buildScrPanel();logAction('duplicou tela');saveLs();toast('Tela duplicada');}
function buildSdivs(){document.querySelectorAll('.sdiv').forEach(d=>d.remove());const s=st();if(!s)return;let y=s.screenH,x=s.screenW;(s.screens||[]).slice(1).forEach(sc=>{const d=document.createElement('div');d.className='sdiv '+(sc.type==='scroll-h'?'vdiv':'hdiv');if(sc.type==='scroll-h'){d.style.left=x+'px';const l=document.createElement('div');l.className='slbl';l.textContent=sc.name+' horizontal';d.appendChild(l);cv().appendChild(d);x+=sc.w||sc.h||s.screenW;}else{d.style.top=y+'px';const l=document.createElement('div');l.className='slbl';l.textContent=sc.name+(sc.type==='scroll-v'?' vertical':'');d.appendChild(l);cv().appendChild(d);y+=sc.h||s.screenH;}});}
function buildScrPanel(){const list=document.getElementById('screens-list');list.innerHTML='';const s=st();if(!s)return;s.screens.forEach((sc,i)=>{const d=document.createElement('div');d.className='sc-item';const b=sc.type==='page'?'PG':sc.type==='scroll-v'?'SV':'SH';d.innerHTML=`<span class="sbadge ${sc.type==='page'?'pg':'sc'}">${b}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:var(--muted2)">${escH(sc.name)}</span>${i>0?`<span class="lbtn" style="color:var(--a2)" onclick=\"delScreen(${sc.id})\">x</span>`:''}`;list.appendChild(d);});}

// -----------------------------------
// ZOOM / FIT / PAN
// -----------------------------------
const CAM_PAD=20000;
function fitCanvas(){const a=document.getElementById('canvas-area');setZoom(Math.round(Math.min((a.clientWidth-120)/cW(),(a.clientHeight-120)/cH(),1)*100));centerCanvas();}
function zs(d,origin=null){setZoom(Math.max(8,Math.min(300,zoom+d)),origin||viewportCenterOrigin());}
function viewportCenterOrigin(){const a=document.getElementById('canvas-area'),r=a.getBoundingClientRect();return{clientX:r.left+a.clientWidth/2,clientY:r.top+a.clientHeight/2};}
function updateCameraSpace(){
  const wrap=document.getElementById('cwrap'),spacer=document.getElementById('camera-spacer'),sc=zoom/100;
  wrap.style.left=CAM_PAD+'px';wrap.style.top=CAM_PAD+'px';
  wrap.style.width=cW()+'px';wrap.style.height=cH()+'px';
  if(spacer){spacer.style.width=Math.ceil(CAM_PAD*2+cW()*sc)+'px';spacer.style.height=Math.ceil(CAM_PAD*2+cH()*sc)+'px';}
  drawRuler();drawMM();
}
function setZoom(z,origin=null){
  const a=document.getElementById('canvas-area'),oldSc=zoom/100,newSc=z/100;
  let anchor=null;
  if(origin){
    const wr=document.getElementById('cwrap').getBoundingClientRect();
    anchor={x:(origin.clientX-wr.left)/oldSc,y:(origin.clientY-wr.top)/oldSc,cx:origin.clientX,cy:origin.clientY};
  }
  zoom=z;document.getElementById('cwrap').style.transform=`scale(${newSc})`;document.getElementById('zoom-lbl').textContent=z+'%';updateCameraSpace();
  if(anchor){
    const ar=a.getBoundingClientRect();
    a.scrollLeft=CAM_PAD+anchor.x*newSc-(anchor.cx-ar.left);
    a.scrollTop=CAM_PAD+anchor.y*newSc-(anchor.cy-ar.top);
  }
}
function centerCanvas(){const a=document.getElementById('canvas-area'),sc=zoom/100;updateCameraSpace();a.scrollLeft=Math.max(0,CAM_PAD+(cW()*sc-a.clientWidth)/2);a.scrollTop=Math.max(0,CAM_PAD+(cH()*sc-a.clientHeight)/2);drawRuler();drawMM();}
function panCanvas(dx,dy){const a=document.getElementById('canvas-area');a.scrollLeft+=dx;a.scrollTop+=dy;drawRuler();drawMM();}
// scroll-wheel zoom/pan
document.getElementById('canvas-area').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zs(e.deltaY<0?8:-8,e);return;}if(e.altKey){e.preventDefault();panCanvas(e.shiftKey?e.deltaY:0,e.shiftKey?0:e.deltaY);}}, {passive:false});

// -----------------------------------
// GRID / SNAP
// -----------------------------------
function toggleGrid(){gridOn=!gridOn;document.getElementById('btn-grid').classList.toggle('on',gridOn);document.getElementById('grid-div').classList.toggle('show',gridOn);}
function toggleSnap(){snapOn=!snapOn;document.getElementById('btn-snap').classList.toggle('on',snapOn);toast(snapOn?'Snap on':'Snap off');}
function snp(v){return snapOn?Math.round(v/GRID)*GRID:Math.round(v);}
function smartSnap(el,x,y){
  if(!snapOn||!el)return{x:snp(x),y:snp(y)};
  const s=st(),tol=6;if(!s)return{x:snp(x),y:snp(y)};
  let nx=snp(x),ny=snp(y);
  const others=s.elements.filter(o=>o.id!==el.id&&!sel.includes(o.id));
  const xs=[0,cW()/2,cW(),...others.flatMap(o=>[o.x,o.x+o.w/2,o.x+o.w])];
  const ys=[0,cH()/2,cH(),...others.flatMap(o=>[o.y,o.y+o.h/2,o.y+o.h])];
  [[0,'x'],[el.w/2,'x'],[el.w,'x']].some(([off])=>{const hit=xs.find(v=>Math.abs(v-(nx+off))<=tol);if(hit!==undefined){nx=snp(hit-off);return true;}return false;});
  [[0,'y'],[el.h/2,'y'],[el.h,'y']].some(([off])=>{const hit=ys.find(v=>Math.abs(v-(ny+off))<=tol);if(hit!==undefined){ny=snp(hit-off);return true;}return false;});
  return{x:Math.max(0,nx),y:Math.max(0,ny)};
}

// -----------------------------------
// RULERS & GUIDES
// -----------------------------------
function toggleRulers(){rulersOn=!rulersOn;document.getElementById('btn-rulers').classList.toggle('on',rulersOn);['ruler-h','ruler-v'].forEach(id=>{document.getElementById(id).classList.toggle('show',rulersOn);});if(rulersOn)drawRuler();}
function drawRuler(){
  const rh=document.getElementById('ruler-h'),rv=document.getElementById('ruler-v');
  if(!rh.classList.contains('show'))return;
  rh.innerHTML='';rv.innerHTML='';
  const sc=zoom/100,step=Math.max(20,Math.round(50/sc/10)*10);
  const wr=document.getElementById('cwrap').getBoundingClientRect();
  const ar=document.getElementById('canvas-area').getBoundingClientRect();
  const ox=wr.left-ar.left-40,oy=wr.top-ar.top-20;
  for(let x=0;x<=cW()+step;x+=step){const px=ox+x*sc;if(px<0)continue;const m=document.createElement('div');m.style.cssText=`position:absolute;left:${px}px;top:0;height:100%;border-left:1px solid var(--border);padding-left:2px;font-family:var(--mono);font-size:7px;color:var(--muted);line-height:20px;pointer-events:none;white-space:nowrap;`;m.textContent=x;rh.appendChild(m);}
  for(let y=0;y<=cH()+step;y+=step){const py=oy+y*sc;if(py<0)continue;const m=document.createElement('div');m.style.cssText=`position:absolute;top:${py}px;left:0;width:20px;border-top:1px solid var(--border);font-family:var(--mono);font-size:7px;color:var(--muted);pointer-events:none;writing-mode:vertical-lr;`;m.textContent=y;rv.appendChild(m);}
  // click to add guides
  rh.onclick=e=>{const wr=document.getElementById('cwrap').getBoundingClientRect();const x=Math.round((e.clientX-wr.left)/sc);const s=st();if(!s)return;s.guides.v.push(x);addGuideEl('v',x);buildGuidesList();saveLs();toast('Guia V x='+x);};
  rv.onclick=e=>{const wr=document.getElementById('cwrap').getBoundingClientRect();const y=Math.round((e.clientY-wr.top)/sc);const s=st();if(!s)return;s.guides.h.push(y);addGuideEl('h',y);buildGuidesList();saveLs();toast('Guia H y='+y);};
}
function buildGuides(){document.querySelectorAll('.gh,.gv').forEach(g=>g.remove());const s=st();if(!s)return;s.guides.h.forEach(y=>addGuideEl('h',y));s.guides.v.forEach(x=>addGuideEl('v',x));}
function addGuideEl(type,pos){
  let cp=pos;const g=document.createElement('div');g.className=type==='h'?'gh':'gv';
  if(type==='h')g.style.top=cp+'px';else g.style.left=cp+'px';
  g.addEventListener('mousedown',e=>{e.stopPropagation();guideDrag={type,el:g,start:cp,sm:type==='h'?e.clientY:e.clientX};});
  g.addEventListener('dblclick',e=>{e.stopPropagation();rmGuide(type,cp);});
  cv().appendChild(g);
}
function rmGuide(type,pos){const s=st();if(!s)return;if(type==='h')s.guides.h=s.guides.h.filter(y=>y!==pos);else s.guides.v=s.guides.v.filter(x=>x!==pos);buildGuides();buildGuidesList();saveLs();}
function buildGuidesList(){
  const list=document.getElementById('guides-list');list.innerHTML='';const s=st();if(!s)return;
  if(!s.guides.h.length&&!s.guides.v.length){list.innerHTML=`<div style="font-size:9px;color:var(--muted);padding:3px 5px">${tr('no_guides')}</div>`;return;}
  const mk=(type,pos)=>{const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:3px;padding:2px 4px;';
    const lbl=document.createElement('span');lbl.style.cssText=`font-family:var(--mono);font-size:8px;color:${type==='h'?'var(--a5)':'var(--a4)'};width:14px;flex-shrink:0;`;lbl.textContent=type.toUpperCase();
    const inp=document.createElement('input');inp.type='number';inp.value=pos;inp.style.cssText='flex:1;background:var(--bg);border:1px solid var(--border2);border-radius:0;color:var(--text);font-family:var(--mono);font-size:9px;padding:1px 3px;outline:none;min-width:0;';
    inp.onchange=()=>{const nv=parseInt(inp.value);if(isNaN(nv))return;const s=st();if(!s)return;const arr=type==='h'?s.guides.h:s.guides.v;const idx=arr.indexOf(pos);if(idx>=0){arr[idx]=nv;buildGuides();buildGuidesList();saveLs();}};
    const del=document.createElement('span');del.style.cssText='cursor:pointer;color:var(--a2);font-size:11px;opacity:.4;padding:0 2px;';del.textContent='x';del.onmouseenter=()=>del.style.opacity='1';del.onmouseleave=()=>del.style.opacity='.4';del.onclick=()=>rmGuide(type,pos);
    row.append(lbl,inp,del);list.appendChild(row);};
  s.guides.h.forEach(y=>mk('h',y));s.guides.v.forEach(x=>mk('v',x));
}
function clearGuides(){const s=st();if(!s)return;s.guides.h=[];s.guides.v=[];buildGuides();buildGuidesList();saveLs();}

// -----------------------------------
// MINIMAP
// -----------------------------------
function toggleMinimap(){mmOn=!mmOn;document.getElementById('btn-mm').classList.toggle('on',mmOn);document.getElementById('minimap').classList.toggle('show',mmOn);if(mmOn)drawMM();}
function drawMM(){if(!mmOn)return;const mc=document.getElementById('mmcanvas');const ctx=mc.getContext('2d');mc.width=mc.offsetWidth*devicePixelRatio;mc.height=mc.offsetHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);const W=mc.offsetWidth,H=mc.offsetHeight,sx=W/cW(),sy=H/cH();ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);const s=st();if(!s)return;s.elements.forEach(el=>{if(!el.visible)return;ctx.fillStyle=el.type==='text'?'rgba(80,80,255,.3)':el.type==='note'?'rgba(255,200,50,.4)':'rgba(180,180,180,.5)';ctx.fillRect(el.x*sx,el.y*sy,el.w*sx,el.h*sy);});const a=document.getElementById('canvas-area'),sc=zoom/100,vp=document.getElementById('mmvp');vp.style.left=(Math.max(0,a.scrollLeft-CAM_PAD)/sc*sx)+'px';vp.style.top=(Math.max(0,a.scrollTop-CAM_PAD)/sc*sy)+'px';vp.style.width=(a.clientWidth/sc*sx)+'px';vp.style.height=(a.clientHeight/sc*sy)+'px';}

// -----------------------------------
// UNDO/REDO
// -----------------------------------
function pushUndo(){const s=st();if(!s)return;s.undoStack.push(JSON.stringify(s.elements));if(s.undoStack.length>MAX_UNDO)s.undoStack.shift();s.redoStack=[];logAction('alteracao no layout');}
function undo(){const s=st();if(!s||!s.undoStack.length)return;s.redoStack.push(JSON.stringify(s.elements));s.elements=JSON.parse(s.undoStack.pop());logAction('undo');rebuildCanvas();saveLs();}
function redo(){const s=st();if(!s||!s.redoStack.length)return;s.undoStack.push(JSON.stringify(s.elements));s.elements=JSON.parse(s.redoStack.pop());logAction('redo');rebuildCanvas();saveLs();}
function rebuildCanvas(){document.querySelectorAll('.el,.onion,.gbox').forEach(d=>d.remove());const s=st();if(!s)return;s.elements.forEach(el=>renderEl(el));if(s.elements.length)cv().classList.add('has-el');updateLayers();renderAssets();buildTL();deselAll();drawMM();}

// -----------------------------------
// TOOLS
// -----------------------------------
function setTool(t){tool=t;['sel','txt','note','brush','brush-soft','eraser','crop'].forEach(id=>{const b=document.getElementById('tool-'+id);if(b)b.classList.toggle('on',id===t);cv().classList.toggle('tool-'+id,id===t);});document.getElementById('toolrail')?.classList.toggle('brush-active',['brush','brush-soft','eraser'].includes(t));cv().style.cursor=t==='sel'?'default':t==='txt'?'text':t==='crop'?'cell':'crosshair';}
cv().addEventListener('click',e=>{
  if(tool!=='txt'&&tool!=='note')return;
  if(e.target!==cv()&&e.target.id!=='grid-div')return;
  const rect=cv().getBoundingClientRect(),sc=zoom/100;
  const x=snp((e.clientX-rect.left)/sc),y=snp((e.clientY-rect.top)/sc);
  if(tool==='txt')mkText(x,y);else mkNote(x,y);
  setTool('sel');
});

