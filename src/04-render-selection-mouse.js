// -----------------------------------
// KEYFRAMES
// -----------------------------------
function saveKF(type){const s=st();if(!s||!sel.length)return;pushUndo();const f=s.tlFrame;sel.forEach(id=>upsertKF(s.elements.find(e=>e.id===id),f,type));buildTL();updateKFIndicators();saveLs();toast('KF salvo - F'+f);}
function upsertKF(el,f,type='all'){
  if(!el)return null;
  let kf=el.keyframes.find(k=>k.frame===f);
  if(!kf){kf={frame:f,x:el.x,y:el.y,w:el.w,h:el.h,rot:el.rotation||0,ease:'linear'};el.keyframes.push(kf);el.keyframes.sort((a,b)=>a.frame-b.frame);}
  if(type==='pos'||type==='all'){kf.x=el.x;kf.y=el.y;}
  if(type==='size'||type==='all'){kf.w=el.w;kf.h=el.h;}
  if(type==='rot'||type==='all'){kf.rot=el.rotation||0;}
  return kf;
}
function delKF(eid,f){const s=st();if(!s)return;pushUndo();const el=s.elements.find(e=>e.id===eid);if(!el)return;el.keyframes=el.keyframes.filter(k=>k.frame!==f);buildTL();saveLs();}
function getInterp(el,f){const kfs=el.keyframes||[];if(!kfs.length)return null;if(kfs.length===1)return kfs[0];if(f<=kfs[0].frame)return kfs[0];if(f>=kfs[kfs.length-1].frame)return kfs[kfs.length-1];for(let i=0;i<kfs.length-1;i++){const a=kfs[i],b=kfs[i+1];if(f>=a.frame&&f<=b.frame){const t=easeT((f-a.frame)/(b.frame-a.frame),a.ease||'linear');return{x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),w:lerp(a.w,b.w,t),h:lerp(a.h,b.h,t),rot:lerp(a.rot||0,b.rot||0,t),ease:a.ease||'linear'};}}return null;}
function easeT(t,ease){if(ease==='ease-in')return t*t;if(ease==='ease-out')return 1-(1-t)*(1-t);if(ease==='ease-in-out')return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;return t;}
function lerp(a,b,t){return a+(b-a)*t;}
function upKFEase(){const s=st();if(!s||!sel.length)return;const el=s.elements.find(e=>e.id===sel[0]);if(!el)return;const kf=el.keyframes.find(k=>k.frame===s.tlFrame);if(!kf)return;pushUndo();kf.ease=document.getElementById('kfease').value||'linear';buildTL();saveLs();}
function updateKFIndicators(){
  const s=st();if(!s)return;
  const f=s.tlFrame;
  // update kf buttons highlight
  if(sel.length===1){
    const el=s.elements.find(e=>e.id===sel[0]);
    if(el){
      const curKF=el.keyframes?.find(k=>k.frame===f);
      const hasKF=!!curKF;
      document.getElementById('kf-cur-ind').style.display=hasKF?'':'none';
      const ease=document.getElementById('kfease');if(ease)ease.value=curKF?.ease||'linear';
      ['pos','size','rot','all'].forEach(t=>{
        const b=document.getElementById('kfb-'+t);if(b)b.classList.toggle('has-kf',hasKF);
      });
    }
  }
  document.getElementById('kff').textContent=f;
}

// -----------------------------------
// RENDER ELEMENT
// -----------------------------------
function renderEl(el){
  const c=cv();let div=document.getElementById('el-'+el.id);
  if(!div){
    div=document.createElement('div');div.id='el-'+el.id;div.className='el';
    if(el.type==='obj'){const cv3=document.createElement('canvas');cv3.className='obj3d';div.appendChild(cv3);setTimeout(()=>initOBJ(el,cv3),60);}
    else if(el.type==='brush'){const bc=document.createElement('canvas');bc.className='brush-canvas';div.appendChild(bc);}
    else if(el.type==='text'||el.type==='note'||el.type==='shape'){const sp=document.createElement('div');sp.className='tc';div.appendChild(sp);if(el.type==='note')div.classList.add('note');if(el.type==='shape')div.classList.add('shape');}
    else{const img=document.createElement('img');img.draggable=false;div.appendChild(img);}
    const lbl=document.createElement('span');lbl.className='el-lbl';div.appendChild(lbl);
    const rh=document.createElement('div');rh.className='rh';div.appendChild(rh);
    const roth=document.createElement('div');roth.className='roth';div.appendChild(roth);
    const kfind=document.createElement('div');kfind.className='kf-ind';div.appendChild(kfind);
    c.appendChild(div);
    div.addEventListener('mousedown',e=>{
      if(previewMode){e.preventDefault();e.stopPropagation();return;}
      if(tool==='crop'){if(!sel.includes(el.id))selOne(el.id);startCropDrag(e,st()?.elements.find(x=>x.id===el.id));return;}
      if(['brush','brush-soft','eraser'].includes(tool)){if(!sel.includes(el.id))selOne(el.id);startBrushStroke(e);return;}
      if(e.target.classList.contains('rh')||e.target.classList.contains('roth'))return;
      let curEl=st()?.elements.find(x=>x.id===el.id);if(!curEl)return;
      if(curEl.locked){toast('Bloqueado');return;}
      e.preventDefault();
      if(e.altKey){if(!sel.includes(el.id))selOne(el.id);duplicateSelection(0,0);curEl=st()?.elements.find(x=>x.id===sel[0]);isDrag=true;}
      else if(e.ctrlKey||e.metaKey){toggleSelEl(el.id);}
      else{if(!sel.includes(el.id)){selOne(el.id);}isDrag=true;pushUndo();}
      const rect=cv().getBoundingClientRect(),sc=zoom/100;
      dragOX=(e.clientX-rect.left)/sc-curEl.x;dragOY=(e.clientY-rect.top)/sc-curEl.y;
    });
    rh.addEventListener('mousedown',e=>{const curEl=st()?.elements.find(x=>x.id===el.id);if(!curEl||curEl.locked)return;e.preventDefault();e.stopPropagation();selOne(el.id);isResize=true;pushUndo();resX=e.clientX;resY=e.clientY;resW=curEl.w;resH=curEl.h;});
    roth.addEventListener('mousedown',e=>{const curEl=st()?.elements.find(x=>x.id===el.id);if(!curEl||curEl.locked)return;e.preventDefault();e.stopPropagation();selOne(el.id);isRot=true;pushUndo();const rect=div.getBoundingClientRect();rotCX=rect.left+rect.width/2;rotCY=rect.top+rect.height/2;rotSA=Math.atan2(e.clientY-rotCY,e.clientX-rotCX)*(180/Math.PI);rotEA=curEl.rotation||0;});
    div.addEventListener('contextmenu',e=>{e.preventDefault();if(!sel.includes(el.id))selOne(el.id);ctxTgt=el.id;showCtx(e.clientX,e.clientY);});
    div.addEventListener('dblclick',()=>{const curEl=st()?.elements.find(x=>x.id===el.id);if(curEl&&(curEl.type==='text'||curEl.type==='note'))startEdit(curEl,div);if(curEl?.type==='shape')openShapeEditor(curEl);});
    div.addEventListener('click',e=>{if(previewMode){e.stopPropagation();simulateAction(el.id,'click');}});
    div.addEventListener('mouseenter',()=>{if(previewMode)simulateAction(el.id,'hover');});
  }
  const curEl=st()?.elements.find(x=>x.id===el.id)||el;
  div.style.left=curEl.x+'px';div.style.top=curEl.y+'px';
  div.style.width=curEl.w+'px';div.style.height=curEl.h+'px';
  div.style.zIndex=curEl.z;div.style.opacity=curEl.opacity;
  div.style.transform=curEl.rotation?`rotate(${curEl.rotation}deg)`:'';
  div.classList.toggle('locked',!!curEl.locked);
  div.classList.toggle('cropped',!!curEl.crop);
  div.classList.toggle('shape',curEl.type==='shape');['button','input','media','nav','modal','card','table','metric'].forEach(c=>div.classList.toggle(c,curEl.shapeVariant===c||curEl.semanticRole===c));
  if(curEl.type==='shape'){Object.assign(div.style,curEl.shapeStyle||{});}
  const s=st();const tlOn=s?.tlActive;
  const inFrame=!tlOn||curEl.perpetuo||(s.tlFrame>=curEl.frameIn&&s.tlFrame<=curEl.frameOut);
  div.style.display=(curEl.visible&&inFrame)?'':'none';
  if(curEl.type==='text'||curEl.type==='note'||curEl.type==='shape'){const sp=div.querySelector('.tc');if(sp){if(curEl.type==='shape')renderShapeContent(sp,curEl);else sp.innerText=curEl.textContent||'';sp.style.fontFamily=curEl.fontFamily||'system-ui';sp.style.fontSize=(curEl.fontSize||16)+'px';sp.style.fontWeight=curEl.fontWeight||'400';sp.style.color=curEl.type==='note'?'#5a3e00':(curEl.fontColor||'#111');sp.style.textAlign=curEl.textAlign||'left';sp.style.display='block';}}
  else if(curEl.type==='brush'){redrawBrush(curEl,div.querySelector('.brush-canvas'));}
  else if(curEl.type!=='obj'){const img=div.querySelector('img');if(img&&curEl.src&&img.src!==curEl.src)img.src=curEl.src;}
  let overlay=div.querySelector('.brush-overlay');if(curEl.type!=='brush'&&(curEl.brushStrokes||[]).length){if(!overlay){overlay=document.createElement('canvas');overlay.className='brush-overlay';div.appendChild(overlay);}redrawBrush(curEl,overlay);}else if(overlay){overlay.remove();}
  renderCutouts(curEl,div);
  div.querySelector('.el-lbl').textContent=curEl.name;
  // kf indicator
  const kfi=div.querySelector('.kf-ind');if(kfi)kfi.style.display=(tlOn&&(curEl.keyframes||[]).some(k=>k.frame===s.tlFrame))?'block':'none';
  drawMM();
}
function startEdit(el,div){const sp=div.querySelector('.tc');sp.contentEditable='true';sp.style.pointerEvents='auto';sp.focus();sp.onblur=()=>{pushUndo();el.textContent=sp.innerText;sp.contentEditable='false';sp.style.pointerEvents='none';saveLs();};}
function openShapeEditor(el){
  openM('Editar componente',`<label>Nome</label><input id="shape-name" value="${escH(el.name)}"><label>Tipo visual</label><input id="shape-variant" value="${escH(el.shapeVariant||el.semanticRole||'')}"><label>Texto / dados</label><textarea id="shape-text" style="min-height:130px">${escH(el.textContent||'')}</textarea>`,()=>{
    pushUndo();
    el.name=document.getElementById('shape-name').value||el.name;
    el.shapeVariant=document.getElementById('shape-variant').value.trim()||el.shapeVariant;
    el.semanticRole=el.semanticRole||el.shapeVariant;
    el.textContent=document.getElementById('shape-text').value;
    renderEl(el);updateLayers();renderAssets();saveLs();
  });
}

// -----------------------------------
// 3D OBJ
// -----------------------------------
function initOBJ(el,cvs){cvs.width=el.w*devicePixelRatio;cvs.height=el.h*devicePixelRatio;cvs.style.width='100%';cvs.style.height='100%';const gl=cvs.getContext('webgl');if(!gl)return;const verts=[],faces=[];(el.objText||'').split('\n').forEach(l=>{const p=l.trim().split(/\s+/);if(p[0]==='v')verts.push(+p[1],+p[2],+p[3]);if(p[0]==='f'){const idx=p.slice(1).map(s=>parseInt(s)-1);for(let i=1;i<idx.length-1;i++)faces.push(idx[0],idx[i],idx[i+1]);}});if(!verts.length)return;let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<verts.length;i+=3){mn[0]=Math.min(mn[0],verts[i]);mx[0]=Math.max(mx[0],verts[i]);mn[1]=Math.min(mn[1],verts[i+1]);mx[1]=Math.max(mx[1],verts[i+1]);mn[2]=Math.min(mn[2],verts[i+2]);mx[2]=Math.max(mx[2],verts[i+2]);}const cc=mn.map((v,i)=>(v+mx[i])/2),r=Math.max(...mn.map((v,i)=>mx[i]-v))||1;const nm=verts.map((v,i)=>(v-cc[i%3])/r);const mk=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;};const pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,'attribute vec3 p;uniform mat4 m;void main(){gl_Position=m*vec4(p,1.);}'));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,'precision mediump float;void main(){gl_FragColor=vec4(.7,.7,.7,1.);}'));gl.linkProgram(pr);gl.useProgram(pr);const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(nm),gl.STATIC_DRAW);const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(faces),gl.STATIC_DRAW);const pl=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(pl);gl.vertexAttribPointer(pl,3,gl.FLOAT,false,0,0);const ml=gl.getUniformLocation(pr,'m');let ang=0;el._3dOn=true;(function d(){if(!el._3dOn)return;ang+=.007;const ca=Math.cos(ang),sa=Math.sin(ang),asp=(cvs.width/cvs.height)||1;gl.viewport(0,0,cvs.width,cvs.height);gl.clearColor(.08,.08,.08,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.uniformMatrix4fv(ml,false,new Float32Array([ca/asp,0,sa,0,0,1,0,0,-sa/asp,0,ca,0,0,0,-3,1]));gl.drawElements(gl.TRIANGLES,faces.length,gl.UNSIGNED_SHORT,0);requestAnimationFrame(d);})();}

// -----------------------------------
// SELECTION
// -----------------------------------
function selOne(id){
  sel=[id];
  document.querySelectorAll('.el').forEach(d=>{d.classList.remove('sel','multi');});
  const d=document.getElementById('el-'+id);if(d)d.classList.add('sel');
  updateLayers();populateAlignRef();
  document.getElementById('multi-props').style.display='none';
  const el=st()?.elements.find(e=>e.id===id);if(el)showProps(el);
  tlRowHL();updateKFIndicators();
}
function renderCutouts(el,div){
  div.querySelectorAll('.cutout,.pasted-fragment').forEach(c=>c.remove());
  (el.cutouts||[]).forEach(c=>{const d=document.createElement('div');d.className='cutout';Object.assign(d.style,{left:c.x+'px',top:c.y+'px',width:c.w+'px',height:c.h+'px'});div.appendChild(d);});
  (el.pastedFragments||[]).forEach(f=>{const d=document.createElement('div');d.className='pasted-fragment';d.textContent=f.source_name||'recorte';Object.assign(d.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px'});div.appendChild(d);});
}
function renderShapeContent(sp,el){
  const v=el.shapeVariant||el.semanticRole||'',text=el.textContent||'';
  if(COMPONENT_RENDER_VARIANTS.has(v)&&!['button','input','media','nav','modal','card','table','metric'].includes(v)){sp.innerHTML=componentMarkup(v,text);return;}
  if(v==='table'){const rows=text.split('\n').filter(Boolean).map(r=>r.includes('|')?r.split('|').map(c=>c.trim()):r.trim().split(/\s{2,}|\t+/));const cols=Math.max(1,...rows.map(r=>r.length));sp.innerHTML=`<div class="shape-table" style="--cols:${cols}">${rows.map((r,i)=>`<div class="shape-tr">${Array.from({length:cols},(_,c)=>`<div class="${i===0?'shape-th':'shape-td'}">${escH(r[c]||'')}</div>`).join('')}</div>`).join('')}</div>`;return;}
  if(v==='metric'){const [label='Metric',value='0',change=''] = text.split('\n');sp.innerHTML=`<div class="metric-view"><div class="metric-label">${escH(label)}</div><div class="metric-value">${escH(value)}</div><div class="metric-change">${escH(change)}</div></div>`;return;}
  if(v==='input'){sp.innerHTML=`<div class="input-view">${escH(text||'Placeholder')}</div>`;return;}
  if(v==='button'){sp.innerHTML=`<div class="button-view">${escH(text||'Button')}</div>`;return;}
  if(v==='nav'){const parts=text.split('|').map(x=>x.trim()).filter(Boolean);const links=parts.slice(1,-1);sp.innerHTML=`<div class="nav-view"><span class="nav-logo">${escH(parts[0]||'Logo')}</span><span class="nav-links">${(links.length?links:['Link','Link','Link']).map(p=>`<span>${escH(p)}</span>`).join('')}</span><span>${escH(parts[parts.length-1]||'CTA')}</span></div>`;return;}
  if(v==='media'){sp.innerHTML=`<div class="media-view">${escH(text||'Image / media')}</div>`;return;}
  sp.innerText=text;
}
function componentMarkup(v,text){
  const lines=text.split('\n'),parts=text.split('|').map(p=>p.trim()).filter(Boolean),safe=escH;
  const first=safe(lines[0]||text||v),second=safe(lines[1]||'');
  if(v==='accordion')return `<div class="cg accordion">${lines.map((l,i)=>`<div class="cg-row"><b>${safe(l.split('|')[0]||'Section')}</b><span>${i?'+' : '-'}</span></div>${i?'':`<p>${safe(l.split('|')[1]||lines[1]||'Expanded content')}</p>`}`).join('')}</div>`;
  if(v==='alert')return `<div class="cg alert"><b>${first}</b><span>${second}</span></div>`;
  if(v==='avatar')return `<div class="cg avatar">${safe((text||'AB').slice(0,2).toUpperCase())}</div>`;
  if(v==='badge')return `<div class="cg badge">${first}</div>`;
  if(v==='breadcrumbs')return `<div class="cg crumbs">${parts.length?parts.map(safe).join('<span>/</span>'):safe(text)}</div>`;
  if(v==='toolbar'||v==='button-group')return `<div class="cg btn-group">${(parts.length?parts:['Left','Center','Right']).map((p,i)=>`<span class="${i===0?'on':''}">${safe(p)}</span>`).join('')}</div>`;
  if(v==='carousel')return `<div class="cg carousel"><button>‹</button><div><b>${first}</b><span>${second||'Slide content'}</span></div><button>›</button></div>`;
  if(v==='checkbox')return `<label class="cg check"><span class="box on"></span><span>${safe(text.replace('[x]','').trim()||'Checkbox label')}</span></label>`;
  if(v==='color-picker')return `<div class="cg colorpick"><span style="background:${safe(text||'#ff3033')}"></span><b>${safe(text||'#ff3033')}</b></div>`;
  if(v==='combobox'||v==='search'||v==='search-input'||v==='text-input')return `<div class="cg field"><span>${first}</span><b>${v==='search'||v==='search-input'?'⌕':'⌄'}</b></div>`;
  if(v==='date-input')return `<div class="cg field"><span>${first}</span><b>▣</b></div>`;
  if(v==='datepicker')return `<div class="cg datepicker"><b>${first}</b><div class="days">${safe(lines.slice(1).join('\n')||'Mo Tu We Th Fr Sa Su\n20 21 22 23 24 25 26')}</div></div>`;
  if(v==='drawer')return `<div class="cg drawer">${lines.map((l,i)=>i?`<span>${safe(l)}</span>`:`<b>${safe(l)}</b>`).join('')}</div>`;
  if(v==='dropdown')return `<div class="cg dropdown">${lines.map((l,i)=>i?`<span>${safe(l)}</span>`:`<b>${safe(l)} ▾</b>`).join('')}</div>`;
  if(v==='empty-state')return `<div class="cg empty"><b>${first}</b><span>${second||'Try creating a new item.'}</span><button>${safe(lines[2]||'Create item')}</button></div>`;
  if(v==='fieldset'||v==='form')return `<div class="cg form"><b>${first}</b>${lines.slice(1).map(l=>`<label>${safe(l)}<span></span></label>`).join('')}<button>${v==='form'?'Submit':'Save'}</button></div>`;
  if(v==='file')return `<div class="cg file"><b>▣</b><span>${first}</span><small>${second}</small></div>`;
  if(v==='file-upload')return `<div class="cg upload"><b>⇧</b><span>${first}</span><small>${second}</small></div>`;
  if(v==='footer'||v==='header'||v==='navigation')return `<div class="cg navish ${v}">${(parts.length?parts:lines).map((p,i)=>`<span class="${i===0?'brand':''}">${safe(p)}</span>`).join('')}</div>`;
  if(v==='heading')return `<div class="cg heading">${first}</div>`;
  if(v==='icon')return `<div class="cg icon">${first}</div>`;
  if(v==='image')return `<div class="cg image"><span>${first}</span></div>`;
  if(v==='label')return `<div class="cg label">${first}</div>`;
  if(v==='link'||v==='skip-link')return `<div class="cg link">${first}</div>`;
  if(v==='list'||v==='tree-view')return `<div class="cg list">${lines.map(l=>`<span>${safe(l)}</span>`).join('')}</div>`;
  if(v==='pagination')return `<div class="cg pagination">${(parts.length?parts:text.split(/\s+/)).filter(Boolean).map((p,i)=>`<span class="${i===1?'on':''}">${safe(p)}</span>`).join('')}</div>`;
  if(v==='popover'||v==='tooltip'||v==='toast')return `<div class="cg pop ${v==='toast'?'toast':''}"><b>${first}</b><span>${second}</span></div>`;
  if(v==='progress-bar'||v==='slider')return `<div class="cg progress"><span><i style="width:${parseInt(text)||72}%"></i></span><b>${first}</b></div>`;
  if(v==='progress-indicator')return `<div class="cg steps">${(parts.length?parts:text.split('>')).map((p,i)=>`<span class="${i<2?'on':''}">${safe(p.trim())}</span>`).join('')}</div>`;
  if(v==='quote')return `<div class="cg quote"><b>${first}</b><span>${second}</span></div>`;
  if(v==='radio')return `<div class="cg radio">${lines.map(l=>`<label><span class="${l.includes('(o)')?'on':''}"></span>${safe(l.replace('(o)','').replace('( )','').trim())}</label>`).join('')}</div>`;
  if(v==='rating')return `<div class="cg rating">${safe(text||'★★★★☆')}</div>`;
  if(v==='rich-text-editor')return `<div class="cg rte"><div>B</div><div>I</div><div>U</div><p>${safe(lines.slice(1).join('\n')||'Editable rich text area')}</p></div>`;
  if(v==='segmented-control')return `<div class="cg segmented">${(parts.length?parts:['Day','Week','Month']).map((p,i)=>`<span class="${i===0?'on':''}">${safe(p)}</span>`).join('')}</div>`;
  if(v==='select')return `<div class="cg field"><span>${first}</span><b>⌄</b></div>`;
  if(v==='separator')return `<div class="cg separator"></div>`;
  if(v==='skeleton')return `<div class="cg skeleton"><span></span><span></span><span></span></div>`;
  if(v==='spinner')return `<div class="cg spinner"></div>`;
  if(v==='stack')return `<div class="cg stack">${lines.map(l=>`<span>${safe(l)}</span>`).join('')}</div>`;
  if(v==='stepper')return `<div class="cg stepper"><button>-</button><b>${safe((text.match(/\d+/)||['3'])[0])}</b><button>+</button></div>`;
  if(v==='tabs')return `<div class="cg tabs"><div>${(parts.length?parts:['Overview','Details','Activity']).slice(0,3).map((p,i)=>`<span class="${i===0?'on':''}">${safe(p)}</span>`).join('')}</div><p>${safe(lines[1]||'Tab panel content')}</p></div>`;
  if(v==='textarea')return `<div class="cg textarea">${first}</div>`;
  if(v==='toggle')return `<div class="cg toggle"><span></span><b>${first}</b></div>`;
  if(v==='video')return `<div class="cg video"><b>▶</b><span>${first}</span></div>`;
  if(v==='visually-hidden')return `<div class="cg vh">${first}</div>`;
  return `<div class="cg generic">${safe(text||v)}</div>`;
}
function toggleSelEl(id){
  if(sel.includes(id))sel=sel.filter(x=>x!==id);else sel.push(id);
  updateSelVisuals();updateLayers();
  if(sel.length===1){const el=st()?.elements.find(e=>e.id===sel[0]);if(el)showProps(el);}
  else if(sel.length>1)showMultiProps();
  else if(sel.length===0)deselAll();
}
function deselAll(){
  sel=[];document.querySelectorAll('.el').forEach(d=>d.classList.remove('sel','multi'));
  updateLayers();
  document.getElementById('nosel').style.display='';document.getElementById('props').style.display='none';
  document.getElementById('multi-props').style.display='none';document.getElementById('tprops').style.display='none';tlRowHL();
}
function updateSelVisuals(){
  document.querySelectorAll('.el').forEach(d=>d.classList.remove('sel','multi'));
  sel.forEach((id,i)=>{const d=document.getElementById('el-'+id);if(d)d.classList.add(sel.length===1?'sel':'multi');});
}

// -----------------------------------
// MOUSE
// -----------------------------------
const area=document.getElementById('canvas-area');

// pan with space+drag
document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&!e.target.matches('input,textarea,select')){e.preventDefault();area.classList.add('pan-ready');isPan=false;}
  if(e.ctrlKey&&e.key==='z'){undo();return;}
  if(e.ctrlKey&&(e.key==='y'||e.key==='Z')){redo();return;}
  if(e.ctrlKey&&e.key.toLowerCase()==='x'&&cropSelection){e.preventDefault();cutCropSelection(true);return;}
  if(e.ctrlKey&&e.key.toLowerCase()==='c'&&cropSelection){e.preventDefault();cutCropSelection(false);return;}
  if(e.ctrlKey&&e.key==='c'&&sel.length){copyEl();return;}
  if(e.ctrlKey&&e.key==='v'){e.preventDefault();pasteEl();return;}
  if(e.ctrlKey&&e.key==='a'){selAll();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&sel.length){e.preventDefault();duplicateSelection();return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&sel.length&&!e.target.matches('input,textarea,select')){e.preventDefault();const n=e.shiftKey?10:1;const dx=e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0;const dy=e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0;nudgeSelection(dx,dy);return;}
  if(e.key==='v'&&!e.ctrlKey&&!e.target.matches('input,textarea,select'))setTool('sel');
  if(e.key==='p'&&!e.ctrlKey&&!e.target.matches('input,textarea,select'))togglePreviewMode();
  if(e.key==='t'&&!e.ctrlKey&&!e.target.matches('input,textarea,select'))setTool('txt');
  if(e.key==='n'&&!e.ctrlKey&&!e.target.matches('input,textarea,select'))setTool('note');
  if(e.key==='b'&&!e.ctrlKey&&!e.target.matches('input,textarea,select'))setTool('brush');
  if((e.key==='Delete'||e.key==='Backspace')&&sel.length&&!e.target.matches('input,textarea,select')){sel.forEach(id=>deleteEl(id));return;}
});
document.addEventListener('keyup',e=>{if(e.code==='Space'){area.classList.remove('pan-ready');area.classList.remove('panning');isPan=false;}});

area.addEventListener('mousedown',e=>{
  if(area.classList.contains('pan-ready')){isPan=true;area.classList.add('panning');panSX=e.clientX;panSY=e.clientY;panScrollX=area.scrollLeft;panScrollY=area.scrollTop;return;}
  if(e.target===cv()||e.target.id==='grid-div'){
    if(['brush','brush-soft','eraser'].includes(tool)){startBrushStroke(e);return;}
    // marquee
    if(!e.ctrlKey&&!e.metaKey)deselAll();
    isMarq=true;
    const rect=area.getBoundingClientRect();
    marqX=e.clientX-rect.left+area.scrollLeft;marqY=e.clientY-rect.top+area.scrollTop;
    const m=document.getElementById('marquee');m.style.display='block';m.style.left=marqX+'px';m.style.top=marqY+'px';m.style.width='0';m.style.height='0';
  }
});

document.addEventListener('mousemove',e=>{
  if(cropDrag){moveCropDrag(e);return;}
  if(brushDrag){moveBrushStroke(e);return;}
  if(isPan){area.scrollLeft=panScrollX-(e.clientX-panSX);area.scrollTop=panScrollY-(e.clientY-panSY);return;}
  if(guideDrag){const sc=zoom/100,d=(guideDrag.type==='h'?e.clientY:e.clientX)-guideDrag.sm;const np=Math.round(guideDrag.start+d/sc);if(guideDrag.type==='h')guideDrag.el.style.top=np+'px';else guideDrag.el.style.left=np+'px';return;}
  if(phDrag){const rect=document.getElementById('tlscroll').getBoundingClientRect();const f=Math.max(0,Math.min(st()?.tlTotal-1||119,Math.round((e.clientX-rect.left+document.getElementById('tlscroll').scrollLeft)/tlFrameW)));tlSeek(f);return;}
  if(tlBarDrag){const s=st();const el=tlBarDrag.el;if(!s||!el)return;const df=Math.round((e.clientX-tlBarDrag.startX)/tlFrameW);if(tlBarDrag.mode==='move'){const dur=tlBarDrag.out0-tlBarDrag.in0;el.frameIn=Math.max(0,Math.min(s.tlTotal-1-dur,tlBarDrag.in0+df));el.frameOut=el.frameIn+dur;}else if(tlBarDrag.mode==='left'){el.frameIn=Math.max(0,Math.min(el.frameOut-1,tlBarDrag.in0+df));}else if(tlBarDrag.mode==='right'){el.frameOut=Math.max(el.frameIn+1,Math.min(s.tlTotal-1,tlBarDrag.out0+df));}if(sel.includes(el.id)){document.getElementById('pfin').value=el.frameIn;document.getElementById('pfout').value=el.frameOut;}buildTL();return;}
  if(isMarq){
    const rect=area.getBoundingClientRect();
    const cx=e.clientX-rect.left+area.scrollLeft;const cy=e.clientY-rect.top+area.scrollTop;
    const mx=Math.min(marqX,cx),my=Math.min(marqY,cy);
    const mw=Math.abs(cx-marqX),mh=Math.abs(cy-marqY);
    const m=document.getElementById('marquee');m.style.left=mx+'px';m.style.top=my+'px';m.style.width=mw+'px';m.style.height=mh+'px';
    // live select
    const sc=zoom/100;
    const wr=document.getElementById('cwrap').getBoundingClientRect(),ar=area.getBoundingClientRect();
    const ox=wr.left-ar.left+area.scrollLeft,oy=wr.top-ar.top+area.scrollTop;
    const rx=(mx-ox)/sc,ry=(my-oy)/sc,rw=mw/sc,rh=mh/sc;
    const s=st();if(s){const newSel=s.elements.filter(el=>el.x<rx+rw&&el.x+el.w>rx&&el.y<ry+rh&&el.y+el.h>ry).map(el=>el.id);sel=newSel;updateSelVisuals();updateLayers();}
    return;
  }
  if(!isDrag&&!isResize&&!isRot)return;
  const s=st();if(!s)return;
  const sc=zoom/100;
  if(isDrag){
    const rect=cv().getBoundingClientRect();
    const primary=s.elements.find(x=>x.id===sel[0]);if(!primary)return;
    const oldX=primary.x,oldY=primary.y;
    const snap=smartSnap(primary,Math.max(0,(e.clientX-rect.left)/sc-dragOX),Math.max(0,(e.clientY-rect.top)/sc-dragOY));
    const nx=snap.x,ny=snap.y,dx=nx-oldX,dy=ny-oldY;
    sel.forEach(id=>{
      const el=s.elements.find(x=>x.id===id);if(!el||el.locked)return;
      if(id===sel[0]){el.x=nx;el.y=ny;}else{el.x=snp(el.x+dx);el.y=snp(el.y+dy);}
      renderEl(el);
    });
    if(sel.length===1){const el=s.elements.find(x=>x.id===sel[0]);if(el)syncPP(el);}
  } else if(isResize){
    const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;
    el.w=snp(Math.max(20,resW+(e.clientX-resX)/sc));el.h=snp(Math.max(20,resH+(e.clientY-resY)/sc));
    renderEl(el);syncPP(el);
  } else if(isRot){
    const el=s.elements.find(x=>x.id===sel[0]);if(!el)return;
    const ca=Math.atan2(e.clientY-rotCY,e.clientX-rotCX)*(180/Math.PI);
    el.rotation=Math.round(rotEA+(ca-rotSA));
    renderEl(el);document.getElementById('prot').value=el.rotation;
  }
  drawMM();
});

document.addEventListener('mouseup',e=>{
  if(cropDrag){finishCropDrag();return;}
  if(brushDrag){finishBrushStroke();return;}
  if(isPan){isPan=false;area.classList.remove('panning');return;}
  if(guideDrag){const sc=zoom/100,d=(guideDrag.type==='h'?e.clientY:e.clientX)-guideDrag.sm;const np=Math.round(guideDrag.start+d/sc);const s=st();if(s){const arr=guideDrag.type==='h'?s.guides.h:s.guides.v;const idx=arr.indexOf(guideDrag.start);if(idx>=0)arr[idx]=np;buildGuidesList();saveLs();}guideDrag=null;return;}
  if(phDrag){phDrag=false;return;}
  if(tlBarDrag){tlBarDrag=null;saveLs();return;}
  if(isMarq){document.getElementById('marquee').style.display='none';isMarq=false;if(sel.length===1){const el=st()?.elements.find(e=>e.id===sel[0]);if(el)showProps(el);}return;}
  if(isDrag||isResize||isRot){autoKeyframeSelection();saveLs();}
  isDrag=false;isResize=false;isRot=false;
});

cv().addEventListener('mousedown',e=>{if(e.target===cv()||e.target.id==='grid-div'){}});
document.addEventListener('click',()=>{hideCtx();hideToolCtx();});
document.getElementById('mov').addEventListener('mousedown',e=>{if(e.target.id==='mov')closeM();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('mov').classList.contains('show'))closeM();});
area.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/layout-builder-component')||e.dataTransfer.files.length)e.preventDefault();});
area.addEventListener('drop',e=>{
  e.preventDefault();
  const kind=e.dataTransfer.getData('application/layout-builder-component');
  if(kind){const rect=cv().getBoundingClientRect(),sc=zoom/100;insertBasicComponent(kind,snp((e.clientX-rect.left)/sc),snp((e.clientY-rect.top)/sc));return;}
  if(e.dataTransfer.files.length)importFiles({target:{files:e.dataTransfer.files,value:''}});
});

function selAll(){const s=st();if(!s)return;sel=s.elements.map(e=>e.id);updateSelVisuals();updateLayers();if(sel.length>1)showMultiProps();}

