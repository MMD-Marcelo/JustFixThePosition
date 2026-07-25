// -----------------------------------
// COPY / PASTE
// -----------------------------------
function copyEl(){const s=st();if(!s||!sel.length)return;clipboard={kind:'elements',items:sel.map(id=>JSON.parse(JSON.stringify(s.elements.find(e=>e.id===id)))).filter(Boolean)};toast('Copiado: '+clipboard.items.length+' elemento(s)');}
function pasteEl(){
  if(!clipboard)return;
  if(Array.isArray(clipboard))clipboard={kind:'elements',items:clipboard};
  if(clipboard.kind==='crop-fragment'){openPasteFragmentModal();return;}
  const items=clipboard.items||[];if(!items.length)return;const s=st();if(!s)return;pushUndo();const newIds=[];
  items.forEach(c=>{const clone={...JSON.parse(JSON.stringify(c)),id:'e'+s.nextId++,x:c.x+20,y:c.y+20,name:c.name+'_c'};s.elements.push(clone);renderEl(clone);newIds.push(clone.id);});
  sel=newIds;updateSelVisuals();updateLayers();renderAssets();buildTL();cv().classList.add('has-el');saveLs();toast('Colado: '+newIds.length);
}
function openPasteFragmentModal(){
  openM('Colar recorte',`<p style="color:var(--muted);font-size:11px;margin:4px 0 10px">Onde você quer colar a área recortada?</p><div class="mrow" style="justify-content:stretch"><button class="mbtn" type="button" onclick="pasteCropFragment('current')">Camada atual</button><button class="mbtn ok" type="button" onclick="pasteCropFragment('new')">Nova camada</button></div>`,()=>{});
}
function pasteCropFragment(mode){
  const s=st();if(!s||clipboard?.kind!=='crop-fragment')return;pushUndo();
  const frag=clipboard,src=frag.source,r=frag.rect;
  if(mode==='current'&&sel.length===1){
    const target=s.elements.find(e=>e.id===sel[0]);
    if(target){target.pastedFragments=target.pastedFragments||[];target.pastedFragments.push({x:r.x-target.x,y:r.y-target.y,w:r.w,h:r.h,source_id:src.id,source_name:src.name,relative:frag.relative});target.desc=(target.desc?target.desc+' | ':'')+'pasted crop fragment from '+src.name;renderEl(target);closeM();saveLs();toast('Colado na camada atual');return;}
  }
  const clone={...JSON.parse(JSON.stringify(src)),id:'e'+s.nextId++,name:src.name+'_cut',x:snp(r.x+20),y:snp(r.y+20),w:snp(r.w),h:snp(r.h),cutouts:[],crop:true,cropFragment:{source_id:src.id,source_name:src.name,relative:frag.relative}};
  s.elements.push(clone);renderEl(clone);sel=[clone.id];updateSelVisuals();updateLayers();renderAssets();buildTL();cv().classList.add('has-el');closeM();saveLs();toast('Recorte colado em nova camada');
}
function duplicateSelection(dx=20,dy=20){const s=st();if(!s||!sel.length)return;pushUndo();const newIds=[];sel.map(id=>s.elements.find(e=>e.id===id)).filter(Boolean).forEach(c=>{const clone={...JSON.parse(JSON.stringify(c)),id:'e'+s.nextId++,x:snp(c.x+dx),y:snp(c.y+dy),name:c.name+'_copy'};s.elements.push(clone);renderEl(clone);newIds.push(clone.id);});sel=newIds;updateSelVisuals();updateLayers();renderAssets();buildTL();cv().classList.add('has-el');saveLs();toast('Duplicado: '+newIds.length);}
function saveComponentFromSelection(){const s=st();if(!s||!sel.length){toast('Selecione elementos');return;}openM('Salvar componente',`<label>Nome</label><input id="cname" value="Componente ${s.components.length+1}">`,()=>{const name=document.getElementById('cname').value.trim()||'Componente';const els=sel.map(id=>s.elements.find(e=>e.id===id)).filter(Boolean).map(e=>JSON.parse(JSON.stringify(e)));s.components.push({id:'c'+Date.now(),name,elements:els});sel.forEach(id=>{const el=s.elements.find(e=>e.id===id);if(el)el.componentName=name;});logAction('salvou componente '+name);updateLayers();saveLs();toast('Componente salvo');});}
function openComponentsPanel(){const s=st();if(!s)return;openM('Componentes',`<div class="component-list">${(s.components||[]).map(c=>`<div class="cmd-item" onclick="insertComponent('${c.id}')">${escH(c.name)} (${c.elements.length})</div>`).join('')||'<div class="hist-item">Nenhum componente salvo</div>'}</div>`,()=>{});}
function insertComponent(cid){const s=st();const comp=s?.components.find(c=>c.id===cid);if(!s||!comp)return;pushUndo();const ids=[];comp.elements.forEach((src,i)=>{const el={...JSON.parse(JSON.stringify(src)),id:'e'+s.nextId++,x:snp(src.x+32),y:snp(src.y+32),name:src.name+'_inst'};s.elements.push(el);renderEl(el);ids.push(el.id);});sel=ids;updateSelVisuals();updateLayers();renderAssets();cv().classList.add('has-el');logAction('inseriu componente '+comp.name);saveLs();closeM();}
function autoKeyframeSelection(){const s=st();if(!s?.tlActive||!s.tlAutoKF||!sel.length)return;sel.forEach(id=>upsertKF(s.elements.find(e=>e.id===id),s.tlFrame,'all'));buildTL();updateKFIndicators();}
function nudgeSelection(dx,dy){const s=st();if(!s||!sel.length)return;pushUndo();sel.forEach(id=>{const el=s.elements.find(e=>e.id===id);if(!el||el.locked)return;el.x=snp(Math.max(0,el.x+dx));el.y=snp(Math.max(0,el.y+dy));renderEl(el);});autoKeyframeSelection();if(sel.length===1){const el=s.elements.find(e=>e.id===sel[0]);if(el)syncPP(el);}updateLayers();saveLs();}

function ensureBrushLayer(){
  const s=st();if(!s)return null;
  let el=!brushNewLayerNext&&sel.length===1?s.elements.find(e=>e.id===sel[0]&&!e.locked):null;
  if(el)return el;
  el=mkEl('Brush Layer','',null,'brush');el.x=0;el.y=0;el.w=cW();el.h=cH();el.z=200+s.elements.length;el.semanticRole='annotation';el.brushStrokes=[];el._newBrushLayer=true;s.elements.push(el);renderEl(el);selOne(el.id);cv().classList.add('has-el');return el;
}
function canvasPoint(e,el){const rect=cv().getBoundingClientRect(),sc=zoom/100;return{x:Math.round((e.clientX-rect.left)/sc-el.x),y:Math.round((e.clientY-rect.top)/sc-el.y)};}
function brushCanvasFor(el){
  const div=document.getElementById('el-'+el.id);if(!div)return null;
  if(el.type==='brush')return div.querySelector('.brush-canvas');
  let overlay=div.querySelector('.brush-overlay');if(!overlay){overlay=document.createElement('canvas');overlay.className='brush-overlay';div.appendChild(overlay);}
  return overlay;
}
function startBrushStroke(e){
  e.preventDefault();e.stopPropagation();pushUndo();
  const el=ensureBrushLayer();if(!el)return;
  const color=document.getElementById('brush-color')?.value||'#111111',size=parseInt(document.getElementById('brush-size')?.value)||6;
  const stroke={tool,color,size:tool==='brush-soft'?size*2:size,soft:tool==='brush-soft',erase:tool==='eraser',points:[canvasPoint(e,el)]};
  el.brushStrokes=el.brushStrokes||[];el.brushStrokes.push(stroke);brushDrag={el,stroke};redrawBrush(el,brushCanvasFor(el));
}
function moveBrushStroke(e){const {el,stroke}=brushDrag;stroke.points.push(canvasPoint(e,el));redrawBrush(el,brushCanvasFor(el));}
function finishBrushStroke(){const el=brushDrag.el;brushDrag=null;if(el){fitBrushLayerToStrokes(el);renderEl(el);syncPP(el);}brushNewLayerNext=false;['tool-brush','tool-brush-soft','tool-eraser'].forEach(id=>document.getElementById(id)?.classList.remove('armed'));renderAssets();updateLayers();saveLs();if(el)selOne(el.id);}
function redrawBrush(el,cvs){
  if(!cvs)return;cvs.width=Math.max(1,el.w)*devicePixelRatio;cvs.height=Math.max(1,el.h)*devicePixelRatio;cvs.style.width='100%';cvs.style.height='100%';
  const ctx=cvs.getContext('2d');ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.clearRect(0,0,el.w,el.h);ctx.lineCap='round';ctx.lineJoin='round';
  (el.brushStrokes||[]).forEach(st=>{if(st.points.length<1)return;ctx.save();ctx.globalCompositeOperation=st.erase?'destination-out':'source-over';ctx.strokeStyle=st.color||'#111';ctx.lineWidth=st.size||6;ctx.globalAlpha=st.soft?.45:1;ctx.beginPath();ctx.moveTo(st.points[0].x,st.points[0].y);st.points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.restore();});
}
function fitBrushLayerToStrokes(el){
  if(!el||el.type!=='brush'||!(el.brushStrokes||[]).length)return;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,maxSize=1;
  el.brushStrokes.forEach(st=>{
    const pad=Math.max(2,(st.size||6)/2+2);maxSize=Math.max(maxSize,pad);
    (st.points||[]).forEach(p=>{
      minX=Math.min(minX,p.x-pad);minY=Math.min(minY,p.y-pad);
      maxX=Math.max(maxX,p.x+pad);maxY=Math.max(maxY,p.y+pad);
    });
  });
  if(!Number.isFinite(minX)||!Number.isFinite(minY)||!Number.isFinite(maxX)||!Number.isFinite(maxY))return;
  minX=Math.floor(minX);minY=Math.floor(minY);maxX=Math.ceil(maxX);maxY=Math.ceil(maxY);
  const absX=el.x+minX,absY=el.y+minY;
  const newW=Math.max(8,maxX-minX),newH=Math.max(8,maxY-minY);
  el.brushStrokes.forEach(st=>(st.points||[]).forEach(p=>{p.x=Math.round(p.x-minX);p.y=Math.round(p.y-minY);}));
  el.x=Math.max(0,Math.round(absX));el.y=Math.max(0,Math.round(absY));el.w=Math.round(newW);el.h=Math.round(newH);
  delete el._newBrushLayer;
}
function startCropDrag(e,el){
  if(!el)return;e.preventDefault();e.stopPropagation();clearCropSelection();
  const p=canvasPoint(e,{x:0,y:0});const box=document.createElement('div');box.className='crop-box';cv().appendChild(box);
  cropDrag={el,start:p,box};
  moveCropDrag(e);
}
function moveCropDrag(e){
  const p=canvasPoint(e,{x:0,y:0}),sx=cropDrag.start.x,sy=cropDrag.start.y;
  const x=Math.max(cropDrag.el.x,Math.min(sx,p.x)),y=Math.max(cropDrag.el.y,Math.min(sy,p.y));
  const r=Math.min(cropDrag.el.x+cropDrag.el.w,Math.max(sx,p.x)),b=Math.min(cropDrag.el.y+cropDrag.el.h,Math.max(sy,p.y));
  cropDrag.rect={x,y,w:Math.max(1,r-x),h:Math.max(1,b-y)};
  Object.assign(cropDrag.box.style,{left:x+'px',top:y+'px',width:cropDrag.rect.w+'px',height:cropDrag.rect.h+'px'});
}
function finishCropDrag(){
  const {el,rect,box}=cropDrag;box.remove();cropDrag=null;
  if(!rect||rect.w<8||rect.h<8){toast('Seleção cancelada');return;}
  const active=document.createElement('div');active.className='crop-box active';Object.assign(active.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'});cv().appendChild(active);
  cropSelection={elementId:el.id,rect,box:active};
  toast('Área selecionada. Ctrl+X para recortar');
}
function clearCropSelection(){if(cropSelection?.box)cropSelection.box.remove();cropSelection=null;}
function cutCropSelection(remove=true){
  const s=st();if(!s||!cropSelection)return;const el=s.elements.find(e=>e.id===cropSelection.elementId);if(!el)return;
  pushUndo();const r=cropSelection.rect,rel={x:Math.max(0,r.x-el.x),y:Math.max(0,r.y-el.y),w:r.w,h:r.h};
  clipboard={kind:'crop-fragment',source:JSON.parse(JSON.stringify(el)),rect:{...r},relative:rel};
  if(remove){el.cutouts=el.cutouts||[];el.cutouts.push(rel);el.crop=true;el.desc=(el.desc?el.desc+' | ':'')+'cut selection '+Math.round(r.w)+'x'+Math.round(r.h);renderEl(el);clearCropSelection();saveLs();toast('Recortado. Ctrl+V para colar');}
  else{saveLs();toast('Área copiada. Ctrl+V para colar');}
}

// -----------------------------------
// PRODUCTIVITY / PREVIEW
// -----------------------------------
function togglePreviewMode(){
  previewMode=!previewMode;previewSwaps.clear();document.body.classList.toggle('preview-mode',previewMode);
  if(!previewMode)rebuildCanvas();else{deselAll();toast('Preview ativo');}
}
function simulateAction(id,eventName){
  const s=st();if(!s)return;const el=s.elements.find(e=>e.id===id);const action=el?.actions?.[eventName];if(!action?.enabled)return;
  if(action.desc)toast(action.desc);
  if(action.swap&&action.swapTarget){const a=document.getElementById('el-'+id),b=document.getElementById('el-'+action.swapTarget);if(a&&b){a.style.display='none';b.style.display='';previewSwaps.set(id,action.swapTarget);}}
}
function openCommandPalette(){
  const actions=[
    [tr('export_json_cmd'),openExportModal],['Preview',togglePreviewMode],[tr('history'),openHistoryPanel],[tr('select_all'),selAll],[tr('import_asset'),triggerImport],[tr('create_text'),()=>setTool('txt')],[tr('create_note'),()=>setTool('note')],['Timeline',toggleTl],['Templates',openTemplateModal],[tr('components'),openComponentsPanel],[tr('save_component'),saveComponentFromSelection],[tr('duplicate_screen'),duplicateScreen],[tr('fit_canvas'),fitCanvas]
  ];
  openM(tr('command_palette'),`<input id="cmdq" placeholder="${tr('search_command_ph')}"><div id="cmdlist" class="cmd-list"></div>`,()=>{});
  const q=document.getElementById('cmdq'),list=document.getElementById('cmdlist');
  const render=()=>{const term=q.value.toLowerCase();list.innerHTML='';actions.filter(a=>a[0].toLowerCase().includes(term)).forEach(([name,fn])=>{const row=document.createElement('div');row.className='cmd-item';row.textContent=name;row.onclick=()=>{closeM();fn();};list.appendChild(row);});};
  q.oninput=render;render();setTimeout(()=>q.focus(),20);
}
function openHistoryPanel(){const s=st();if(!s)return;openM(tr('history'),`<div class="history-list">${(s.history||[]).map(h=>`<div class="hist-item"><b>${escH(new Date(h.at).toLocaleTimeString())}</b> ${escH(h.message)}</div>`).join('')||`<div class="hist-item">${tr('no_history')}</div>`}</div>`,()=>{});}

// -----------------------------------
// LAYERS
// -----------------------------------
function updateLayers(){
  const list=document.getElementById('layers-list');list.innerHTML='';
  document.querySelectorAll('.gbox').forEach(g=>g.remove());
  const s=st();if(!s)return;
  const q=(document.getElementById('layer-search')?.value||'').toLowerCase();
  [...s.elements].filter(el=>!q||[el.name,el.type,el.group,el.semanticRole,el.componentName].join(' ').toLowerCase().includes(q)).reverse().forEach(el=>{
    const d=document.createElement('div');
    d.className='layer-item'+(sel.length===1&&sel[0]===el.id?' sel':sel.includes(el.id)?' multi-sel':'')+(el.locked?' locked':'');
    d.draggable=true;
    const badge=el.type==='obj'?'3D':el.type==='gif'?'GIF':el.type==='svg'?'SVG':el.type==='text'?'TXT':el.type==='note'?'NTE':'IMG';
    d.innerHTML=`<span class="lbadge">${badge}</span><span class="lname">${escH(el.name)}${el.semanticRole?` · ${escH(el.semanticRole)}`:''}</span><span class="lbtn" title="Mostrar/Ocultar">${el.visible?'V':'-'}</span><span class="lbtn" title="Bloquear">${el.locked?'L':' '}</span>`;
    d.onclick=ev=>{if(ev.ctrlKey||ev.metaKey)toggleSelEl(el.id);else selOne(el.id);};
    d.ondblclick=ev=>{ev.stopPropagation();startLayerRename(d,el);};
    const btns=d.querySelectorAll('.lbtn');
    btns[0].onclick=ev=>{ev.stopPropagation();el.visible=!el.visible;renderEl(el);updateLayers();saveLs();};
    btns[1].onclick=ev=>{ev.stopPropagation();el.locked=!el.locked;renderEl(el);updateLayers();saveLs();};
    d.addEventListener('dragstart',e=>{layDragId=el.id;e.dataTransfer.effectAllowed='move';});
    d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('drag-over');});
    d.addEventListener('dragleave',()=>d.classList.remove('drag-over'));
    d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('drag-over');if(!layDragId||layDragId===el.id)return;const s=st();if(!s)return;pushUndo();const fi=s.elements.findIndex(x=>x.id===layDragId);const ti=s.elements.findIndex(x=>x.id===el.id);const[mv]=s.elements.splice(fi,1);s.elements.splice(ti,0,mv);updateLayers();buildTL();saveLs();});
    d.addEventListener('dragend',()=>document.querySelectorAll('.layer-item').forEach(x=>x.classList.remove('drag-over')));
    list.appendChild(d);
    // group outline
    if(el.group&&s.groups[el.group]){const ids=s.groups[el.group],els=s.elements.filter(e=>ids.includes(e.id));if(els.length>1){const mnX=Math.min(...els.map(e=>e.x)),mnY=Math.min(...els.map(e=>e.y)),mxX=Math.max(...els.map(e=>e.x+e.w)),mxY=Math.max(...els.map(e=>e.y+e.h));const gb=document.createElement('div');gb.className='gbox';gb.style.cssText=`left:${mnX-4}px;top:${mnY-4}px;width:${mxX-mnX+8}px;height:${mxY-mnY+8}px;`;cv().appendChild(gb);}}
  });
}

function startLayerRename(row,el){
  const name=row.querySelector('.lname');if(!name)return;
  const input=document.createElement('input');input.className='layer-name-input';input.value=el.name;
  name.replaceWith(input);input.focus();input.select();
  const commit=()=>{el.name=input.value.trim()||el.name;const div=document.getElementById('el-'+el.id);if(div)div.querySelector('.el-lbl').textContent=el.name;updateLayers();renderAssets();buildTL();saveLs();};
  input.onkeydown=e=>{if(e.key==='Enter')commit();if(e.key==='Escape')updateLayers();};
  input.onblur=commit;
}

// -----------------------------------
// GROUPS - multiple selection
// -----------------------------------
function groupSel(){
  if(sel.length<2){toast('Selecione ao menos 2 elementos (Ctrl+clique)');return;}
  openM('Criar Grupo',`<label>Nome</label><input id="m-gn" placeholder="header">`,()=>{
    const s=st();if(!s)return;const gname=document.getElementById('m-gn').value||'grupo';
    if(!s.groups[gname])s.groups[gname]=[];
    sel.forEach(id=>{if(!s.groups[gname].includes(id))s.groups[gname].push(id);const el=s.elements.find(e=>e.id===id);if(el)el.group=gname;});
    updateLayers();updateGroupSel();saveLs();toast('Grupo: '+gname+' ('+sel.length+' elementos)');
  });
}
function ctxGroup(){hideCtx();groupSel();}
function updateGroupSel(){const s=st();if(!s)return;const sel2=document.getElementById('pgroup');if(!sel2)return;const cur=sel2.value;sel2.innerHTML='<option value="">Sem grupo</option>';Object.keys(s.groups||{}).forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;if(g===cur)o.selected=true;sel2.appendChild(o);});}

// -----------------------------------
// COLOR VARS
// -----------------------------------
function addVar(){const s=st();if(!s)return;const name=document.getElementById('vname').value.trim()||'var-'+s.colorVars.length;const val=document.getElementById('vpick').value;if(s.colorVars.find(v=>v.name===name)){toast('Ja existe');return;}s.colorVars.push({name,value:val});document.getElementById('vname').value='';renderVars();saveLs();}
function renderVars(){const s=st();if(!s)return;const list=document.getElementById('vars-list');list.innerHTML='';(s.colorVars||[]).forEach(v=>{const b=document.createElement('span');b.className='var-tag';b.innerHTML=`<span class="vdot" style="background:${v.value}"></span>${escH(v.name)}`;b.title='Dbl-clique para remover';b.ondblclick=()=>{s.colorVars=s.colorVars.filter(x=>x.name!==v.name);renderVars();saveLs();};list.appendChild(b);});const sel2=document.getElementById('ptvar');if(!sel2)return;const cur=sel2.value;sel2.innerHTML='<option value=\"\">nenhuma</option>';(s.colorVars||[]).forEach(v=>{const o=document.createElement('option');o.value=v.name;o.textContent=v.name;if(cur===v.name)o.selected=true;sel2.appendChild(o);});}
function bindVar(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(e=>e.id===sel[0]);if(!el)return;el.colorVar=document.getElementById('ptvar').value;const v=s.colorVars.find(x=>x.name===el.colorVar);if(v){el.fontColor=v.value;document.getElementById('ptcolor').value=v.value;}upTxt();saveLs();}

// -----------------------------------
// PROPERTIES
// -----------------------------------
function showProps(el){document.getElementById('nosel').style.display='none';document.getElementById('multi-props').style.display='none';document.getElementById('props').style.display='';syncProps(el);syncMetaProps(el);populateSwaps(el);renderVars();populateAlignRef();populateGroupSel2(el);}
function showMultiProps(){document.getElementById('nosel').style.display='none';document.getElementById('props').style.display='none';document.getElementById('multi-props').style.display='';const s=st();const els=sel.map(id=>s?.elements.find(e=>e.id===id)).filter(Boolean);const avg=els.length?Math.round(els.reduce((a,e)=>a+(e.opacity??1),0)/els.length*100):100;document.getElementById('mopac').value=avg;document.getElementById('mopv').textContent=avg+'%';}
function syncProps(el){if(!el)return;document.getElementById('px').value=Math.round(el.x);document.getElementById('py').value=Math.round(el.y);document.getElementById('pw').value=Math.round(el.w);document.getElementById('ph').value=Math.round(el.h);document.getElementById('pz').value=el.z;document.getElementById('prot').value=el.rotation||0;document.getElementById('popac').value=Math.round((el.opacity??1)*100);document.getElementById('ov').textContent=Math.round((el.opacity??1)*100)+'%';document.getElementById('pname').value=el.name;document.getElementById('pdesc').value=el.desc||'';document.getElementById('pgroup').value=el.group||'';const isTxt=el.type==='text'||el.type==='note'||el.type==='shape';document.getElementById('tprops').style.display=isTxt?'block':'none';if(isTxt){document.getElementById('ptxt').value=el.textContent||'';document.getElementById('pfont').value=el.fontFamily||'system-ui';document.getElementById('ptsize').value=el.fontSize||16;document.getElementById('ptcolor').value=el.fontColor||'#111111';document.getElementById('ptweight').value=el.fontWeight||'400';document.getElementById('ptalign').value=el.textAlign||'left';document.getElementById('ptvar').value=el.colorVar||'';}const tlOn=st()?.tlActive;document.getElementById('tlpg').style.display=tlOn?'':'none';document.getElementById('kfpg').style.display=tlOn?'':'none';if(tlOn){document.getElementById('pperp').checked=!!el.perpetuo;document.getElementById('tltiming').style.display=el.perpetuo?'none':'';document.getElementById('pfin').value=el.frameIn??0;document.getElementById('pfout').value=el.frameOut??(st().tlTotal-1);document.getElementById('gifrow').style.display=el.type==='gif'?'':'none';document.getElementById('pgifmode').value=el.gifMode||'loop';}const ac=el.actions||{};document.getElementById('hclick').checked=!!ac.click?.enabled;document.getElementById('cclick').classList.toggle('open',!!ac.click?.enabled);document.getElementById('pclick').value=ac.click?.desc||'';document.getElementById('hcswap').checked=!!ac.click?.swap;document.getElementById('ccswap').classList.toggle('open',!!ac.click?.swap);document.getElementById('hhover').checked=!!ac.hover?.enabled;document.getElementById('chover').classList.toggle('open',!!ac.hover?.enabled);document.getElementById('phover').value=ac.hover?.desc||'';document.getElementById('hhswap').checked=!!ac.hover?.swap;document.getElementById('chswap').classList.toggle('open',!!ac.hover?.swap);}
function syncPP(el){document.getElementById('px').value=Math.round(el.x);document.getElementById('py').value=Math.round(el.y);document.getElementById('pw').value=Math.round(el.w);document.getElementById('ph').value=Math.round(el.h);}
function syncMetaProps(el){document.getElementById('psemantic').value=el.semanticRole||'';document.getElementById('pcx').value=el.constraints?.x||'left';document.getElementById('pcy').value=el.constraints?.y||'top';document.getElementById('pcomponent').value=el.componentName||'';['normal','hover','active','disabled','loading','error'].forEach(k=>{const cb=document.getElementById('st-'+k);if(cb)cb.checked=!!(el.states||{})[k];});}
function upP(f){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;if(f==='x')el.x=parseFloat(document.getElementById('px').value)||0;if(f==='y')el.y=parseFloat(document.getElementById('py').value)||0;if(f==='w')el.w=parseFloat(document.getElementById('pw').value)||100;if(f==='h')el.h=parseFloat(document.getElementById('ph').value)||100;if(f==='z')el.z=parseInt(document.getElementById('pz').value)||1;if(f==='rot')el.rotation=parseFloat(document.getElementById('prot').value)||0;renderEl(el);saveLs();}
function upOpac(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;const v=parseInt(document.getElementById('popac').value);el.opacity=v/100;document.getElementById('ov').textContent=v+'%';const d=document.getElementById('el-'+el.id);if(d)d.style.opacity=el.opacity;saveLs();}
function upMultiOpac(){const s=st();if(!s||sel.length<2)return;const v=parseInt(document.getElementById('mopac').value)||100;document.getElementById('mopv').textContent=v+'%';pushUndo();sel.forEach(id=>{const el=s.elements.find(e=>e.id===id);if(!el)return;el.opacity=v/100;const d=document.getElementById('el-'+id);if(d)d.style.opacity=el.opacity;});logAction('opacidade em lote');saveLs();}
function upName(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;el.name=document.getElementById('pname').value;const d=document.getElementById('el-'+el.id);if(d)d.querySelector('.el-lbl').textContent=el.name;updateLayers();buildTL();saveLs();}
function upGroup(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;const g=document.getElementById('pgroup').value;if(el.group&&s.groups[el.group])s.groups[el.group]=s.groups[el.group].filter(id=>id!==el.id);el.group=g;if(g){if(!s.groups[g])s.groups[g]=[];if(!s.groups[g].includes(el.id))s.groups[g].push(el.id);}updateLayers();saveLs();}
function upDesc(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(el){el.desc=document.getElementById('pdesc').value;saveLs();}}
function upMeta(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;el.semanticRole=document.getElementById('psemantic').value;el.constraints={x:document.getElementById('pcx').value,y:document.getElementById('pcy').value};el.componentName=document.getElementById('pcomponent').value.trim();updateLayers();saveLs();}
function upStates(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;el.states={};['normal','hover','active','disabled','loading','error'].forEach(k=>el.states[k]=!!document.getElementById('st-'+k)?.checked);saveLs();}
function upMultiSemantic(){const s=st();if(!s||sel.length<2)return;const role=document.getElementById('msemantic').value;if(!role)return;pushUndo();sel.forEach(id=>{const el=s.elements.find(e=>e.id===id);if(el)el.semanticRole=role;});logAction('semantica em lote: '+role);updateLayers();saveLs();}
function upTxt(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;el.textContent=document.getElementById('ptxt').value;el.fontFamily=document.getElementById('pfont').value;el.fontSize=parseInt(document.getElementById('ptsize').value)||16;el.fontColor=document.getElementById('ptcolor').value;el.fontWeight=document.getElementById('ptweight').value;el.textAlign=document.getElementById('ptalign').value;renderEl(el);saveLs();}
function upTl(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;el.perpetuo=document.getElementById('pperp').checked;document.getElementById('tltiming').style.display=el.perpetuo?'none':'';if(!el.perpetuo){el.frameIn=parseInt(document.getElementById('pfin').value)||0;el.frameOut=parseInt(document.getElementById('pfout').value)||(s.tlTotal-1);}el.gifMode=document.getElementById('pgifmode').value||'loop';buildTL();applyFrame(s.tlFrame);saveLs();}
function togColl(id,cbId){const cb=document.getElementById(cbId);if(cb)document.getElementById(id).classList.toggle('open',cb.checked);upAct();}
function upAct(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;el.actions={click:{enabled:document.getElementById('hclick').checked,desc:document.getElementById('pclick').value,swap:document.getElementById('hcswap').checked,swapTarget:document.getElementById('cswap').value},hover:{enabled:document.getElementById('hhover').checked,desc:document.getElementById('phover').value,swap:document.getElementById('hhswap').checked,swapTarget:document.getElementById('hswap').value}};saveLs();}
function populateSwaps(el){const s=st();if(!s)return;['cswap','hswap'].forEach((sid,i)=>{const sel2=document.getElementById(sid);sel2.innerHTML='<option value=\"\">escolha</option>';s.elements.filter(e=>e.id!==el.id).forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=e.name+(e.type==='gif'?' [GIF]':'');const cur=i===0?el.actions?.click?.swapTarget:el.actions?.hover?.swapTarget;if(String(e.id)===String(cur))o.selected=true;sel2.appendChild(o);});});}
function populateGroupSel2(el){const s=st();if(!s)return;const sel2=document.getElementById('pgroup');if(!sel2)return;const cur=el.group||'';sel2.innerHTML='<option value="">Sem grupo</option>';Object.keys(s.groups||{}).forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;if(g===cur)o.selected=true;sel2.appendChild(o);});}
function populateAlignRef(){const s=st();if(!s)return;const sel2=document.getElementById('aref');sel2.innerHTML='<option value=\"\">ref</option>';s.elements.filter(e=>!sel.includes(e.id)).forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=e.name;sel2.appendChild(o);});}

// -----------------------------------
// ALIGN
// -----------------------------------
function alignEl(mode){const s=st();if(!s||!sel.length)return;pushUndo();const W=cW(),H=cH();sel.forEach(id=>{const el=s.elements.find(x=>x.id===id);if(!el)return;if(mode==='left')el.x=0;else if(mode==='cx')el.x=snp((W-el.w)/2);else if(mode==='right')el.x=snp(W-el.w);else if(mode==='top')el.y=0;else if(mode==='cy')el.y=snp((H-el.h)/2);else if(mode==='bot')el.y=snp(H-el.h);else if(mode==='center'){el.x=snp((W-el.w)/2);el.y=snp((H-el.h)/2);}renderEl(el);});if(sel.length===1){const el=s.elements.find(x=>x.id===sel[0]);if(el)syncPP(el);}saveLs();}
function alignRef(mode){const s=st();if(!s||!sel.length)return;const refId=document.getElementById('aref').value;if(!refId)return;const ref=s.elements.find(e=>String(e.id)===refId);if(!ref)return;pushUndo();const rcx=ref.x+ref.w/2,rcy=ref.y+ref.h/2;sel.forEach(id=>{const el=s.elements.find(x=>x.id===id);if(!el)return;if(mode==='cx'||mode==='c')el.x=snp(rcx-el.w/2);if(mode==='cy'||mode==='c')el.y=snp(rcy-el.h/2);renderEl(el);});saveLs();}
function distributeSel(axis){const s=st();if(!s||sel.length<3)return;const els=sel.map(id=>s.elements.find(e=>e.id===id)).filter(Boolean).sort((a,b)=>axis==='x'?a.x-b.x:a.y-b.y);pushUndo();const first=els[0],last=els[els.length-1];const start=axis==='x'?first.x:first.y;const end=axis==='x'?last.x:last.y;const step=(end-start)/(els.length-1);els.forEach((el,i)=>{if(axis==='x')el.x=snp(start+step*i);else el.y=snp(start+step*i);renderEl(el);});logAction('distribuir '+axis);updateLayers();saveLs();}
function equalizeSel(mode){const s=st();if(!s||sel.length<2)return;const ref=s.elements.find(e=>e.id===sel[0]);if(!ref)return;pushUndo();sel.slice(1).forEach(id=>{const el=s.elements.find(e=>e.id===id);if(!el)return;if(mode==='w'||mode==='both')el.w=ref.w;if(mode==='h'||mode==='both')el.h=ref.h;renderEl(el);});logAction('equalizar tamanho');updateLayers();saveLs();}

