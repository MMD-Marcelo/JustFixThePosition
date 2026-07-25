// -----------------------------------
// TIMELINE
// -----------------------------------
let tlBarDrag=null;
function toggleTl(){const s=st();if(!s)return;s.tlActive=!s.tlActive;const on=s.tlActive;document.getElementById('tl').classList.toggle('show',on);document.getElementById('tlicon').textContent=on?'-':'+';document.getElementById('tlstatus').textContent=on?tr('active'):tr('inactive');document.getElementById('tlpg').style.display=on?'':'none';document.getElementById('kfpg').style.display=on?'':'none';if(on){buildTL();applyFrame(s.tlFrame);}else{s.elements.forEach(el=>{const d=document.getElementById('el-'+el.id);if(d)d.style.display=el.visible?'':'none';});}if(sel.length){const el=s.elements.find(e=>e.id===sel[0]);if(el)syncProps(el);}saveLs();fitCanvas();}
function updateTlMeta(){const s=st();if(!s)return;const d=document.getElementById('tldur');if(d)d.textContent=frameSec(s.tlTotal,s.tlFPS||24).toFixed(2)+'s';}
function upTlTotal(){const s=st();if(!s)return;s.tlTotal=Math.max(1,parseInt(document.getElementById('tltotal').value)||120);s.elements.forEach(el=>{el.frameOut=Math.min(el.frameOut??s.tlTotal-1,s.tlTotal-1);});updateTlMeta();buildTL();saveLs();}
function upTlFPS(){const s=st();if(!s)return;s.tlFPS=Math.max(1,parseInt(document.getElementById('tlfps').value)||24);updateTlMeta();saveLs();}
function upTlZoom(){const s=st();if(!s)return;tlFrameW=Math.max(4,Math.min(40,parseInt(document.getElementById('tlzoom').value)||11));s.tlFrameW=tlFrameW;buildTL();saveLs();}
function upTimelinePrefs(){const s=st();if(!s)return;s.tlAutoKF=!!document.getElementById('tlautokf')?.checked;saveLs();}
function buildTL(){
  const s=st();if(!s||!s.tlActive)return;hydrateState(s);tlFrameW=s.tlFrameW||tlFrameW;
  const lbls=document.getElementById('tllabels');const inner=document.getElementById('tlinner');
  [...inner.children].forEach(c=>{if(c.id!=='tlruler')c.remove();});lbls.innerHTML='';
  const TW=s.tlTotal*tlFrameW;inner.style.width=TW+'px';
  document.getElementById('tlfps').value=s.tlFPS||24;document.getElementById('tltotal').value=s.tlTotal;document.getElementById('tlzoom').value=tlFrameW;updateTlMeta();
  const ruler=document.getElementById('tlruler');ruler.style.width=TW+'px';ruler.innerHTML='';
  for(let f=0;f<=s.tlTotal;f+=5){const m=document.createElement('div');m.style.cssText=`position:absolute;left:${f*tlFrameW}px;top:0;height:100%;border-left:1px solid var(--border);font-family:var(--mono);font-size:7px;color:var(--muted);padding-left:2px;line-height:20px;pointer-events:none;`;m.textContent=f;ruler.appendChild(m);}
  let phh=document.getElementById('tl-playhead-head');if(!phh){phh=document.createElement('div');phh.id='tl-playhead-head';phh.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();phDrag=true;});}ruler.appendChild(phh);
  ruler.onclick=e=>{const rect=ruler.getBoundingClientRect();const f=Math.max(0,Math.min(s.tlTotal-1,Math.round((e.clientX-rect.left+document.getElementById('tlscroll').scrollLeft)/tlFrameW)));tlSeek(f);};
  let phl=document.getElementById('tl-playhead');if(!phl){phl=document.createElement('div');phl.id='tl-playhead';}inner.appendChild(phl);
  if(!s.elements.length){
    document.getElementById('tlbody').classList.add('tl-empty');
    const emptyLbl=document.createElement('div');emptyLbl.className='trlbl empty';emptyLbl.textContent=tr('no_timeline_elements');lbls.appendChild(emptyLbl);
    const empty=document.createElement('div');empty.className='tl-empty-msg';empty.textContent=tr('timeline_empty_hint');inner.appendChild(empty);
    phh.style.display='none';phl.style.display='none';updatePH();return;
  }
  document.getElementById('tlbody').classList.remove('tl-empty');phh.style.display='';phl.style.display='';
  const groups=[...new Set(s.elements.map(el=>el.group||tr('untitled_group')))];
  groups.forEach(group=>{const groupEls=s.elements.filter(el=>(el.group||tr('untitled_group'))===group);const collapsed=!!s.collapsedGroups[group];
    const gl=document.createElement('div');gl.className='trlbl group';gl.textContent=(collapsed?'+ ':'- ')+group;gl.onclick=()=>{s.collapsedGroups[group]=!collapsed;buildTL();saveLs();};lbls.appendChild(gl);
    const gr=document.createElement('div');gr.className='trk group';gr.style.width=TW+'px';inner.appendChild(gr);if(collapsed)return;
    [...groupEls].reverse().forEach(el=>{const lbl=document.createElement('div');lbl.className='trlbl'+(sel.includes(el.id)?' sel':'');lbl.textContent=el.name;lbl.title=el.name;lbl.onclick=()=>selOne(el.id);lbls.appendChild(lbl);const trk=document.createElement('div');trk.className='trk';trk.style.width=TW+'px';
      if(!el.perpetuo){const bar=document.createElement('div');bar.className='tbar';bar.style.left=(el.frameIn*tlFrameW)+'px';bar.style.width=((el.frameOut-el.frameIn+1)*tlFrameW)+'px';const bl=document.createElement('div');bl.className='tbl';const bb=document.createElement('div');bb.className='tbb';bb.textContent=el.name+' ('+frameSec(el.frameOut-el.frameIn+1,s.tlFPS||24).toFixed(2)+'s)';const br=document.createElement('div');br.className='tbr';bar.append(bl,bb,br);bb.addEventListener('mousedown',e=>{e.stopPropagation();tlBarDrag={mode:'move',el,startX:e.clientX,in0:el.frameIn,out0:el.frameOut};});bl.addEventListener('mousedown',e=>{e.stopPropagation();tlBarDrag={mode:'left',el,startX:e.clientX,in0:el.frameIn,out0:el.frameOut};});br.addEventListener('mousedown',e=>{e.stopPropagation();tlBarDrag={mode:'right',el,startX:e.clientX,in0:el.frameIn,out0:el.frameOut};});trk.appendChild(bar);} else {const bar=document.createElement('div');bar.className='tbar perp';bar.style.cssText=`left:0;width:${TW}px;`;const bb=document.createElement('div');bb.className='tbb';bb.textContent=el.name+' ['+tr('perpetual_short')+']';bar.appendChild(bb);trk.appendChild(bar);} 
      (el.keyframes||[]).forEach(kf=>{const d=document.createElement('div');d.className='kfd';d.style.left=(kf.frame*tlFrameW)+'px';d.title='KF F'+kf.frame+' - '+(kf.ease||'linear')+' - dbl-clique remove';d.onclick=e=>{e.stopPropagation();tlSeek(kf.frame);selOne(el.id);};d.ondblclick=e=>{e.stopPropagation();delKF(el.id,kf.frame);};trk.appendChild(d);});
      trk.addEventListener('click',e=>{if(e.target===trk){const rect=trk.getBoundingClientRect();tlSeek(Math.max(0,Math.min(s.tlTotal-1,Math.round((e.clientX-rect.left)/tlFrameW))));}});inner.appendChild(trk);});});
  updatePH();
}
function tlRowHL(){document.querySelectorAll('.trlbl').forEach(l=>l.classList.remove('sel'));if(!sel.length)return;const s=st();if(!s)return;const idx=[...document.querySelectorAll('.trlbl')].findIndex(l=>sel.some(id=>l.textContent===s.elements.find(e=>e.id===id)?.name));const lbls=document.querySelectorAll('.trlbl');if(lbls[idx])lbls[idx].classList.add('sel');}
function updatePH(){const s=st();if(!s)return;const phh=document.getElementById('tl-playhead-head');const phl=document.getElementById('tl-playhead');if(phh)phh.style.left=(s.tlFrame*tlFrameW)+'px';if(phl){phl.style.left=(s.tlFrame*tlFrameW)+'px';phl.style.height=document.getElementById('tlinner').scrollHeight+'px';}const sc=document.getElementById('tlscroll');if(sc)sc.scrollLeft=Math.max(0,s.tlFrame*tlFrameW-80);document.getElementById('tlfd').textContent='F '+s.tlFrame+' / '+frameSec(s.tlFrame,s.tlFPS||24).toFixed(2)+'s';}
function tlSeek(f){const s=st();if(!s)return;s.tlFrame=Math.max(0,Math.min(s.tlTotal-1,f));updatePH();applyFrame(s.tlFrame);if(document.getElementById('tlonion').checked)renderOnion();updateKFIndicators();sel.forEach(id=>{const el=s.elements.find(e=>e.id===id);if(el){const kf=el.keyframes?.length&&document.getElementById('tlinterp')?.checked?getInterp(el,f):null;if(kf){const d=document.getElementById('el-'+id);if(d){d.style.left=kf.x+'px';d.style.top=kf.y+'px';d.style.width=kf.w+'px';d.style.height=kf.h+'px';d.style.transform=`rotate(${kf.rot||0}deg)`;if(id===sel[0])syncPP({x:kf.x,y:kf.y,w:kf.w,h:kf.h});}}}});}
function applyFrame(f){const s=st();if(!s||!s.tlActive)return;s.elements.forEach(el=>{const d=document.getElementById('el-'+el.id);if(!d)return;const vis=el.visible&&(el.perpetuo||(f>=el.frameIn&&f<=el.frameOut));d.style.display=vis?'':'none';if(vis&&el.keyframes?.length&&document.getElementById('tlinterp')?.checked){const kf=getInterp(el,f);if(kf){d.style.left=kf.x+'px';d.style.top=kf.y+'px';d.style.width=kf.w+'px';d.style.height=kf.h+'px';d.style.transform=`rotate(${kf.rot||0}deg)`;}}});}
function tlTogglePlay(){tlPlay=!tlPlay;const btn=document.getElementById('tlplay');btn.classList.toggle('on',tlPlay);btn.textContent=tlPlay?'Pause':'Play';if(tlPlay){tlLastT=performance.now();tlAccum=0;requestAnimationFrame(tlTick);}}
function tlTick(now){if(!tlPlay)return;const s=st();if(!s)return;tlAccum+=now-tlLastT;tlLastT=now;const spf=1000/(s.tlFPS||24);while(tlAccum>=spf){tlAccum-=spf;s.tlFrame++;if(s.tlFrame>=s.tlTotal){if(document.getElementById('tlloop').checked)s.tlFrame=0;else{s.tlFrame=s.tlTotal-1;tlTogglePlay();break;}}tlSeek(s.tlFrame);}requestAnimationFrame(tlTick);}
function tlKFFrames(){const s=st();if(!s)return[];const pool=sel.length?s.elements.filter(e=>sel.includes(e.id)):s.elements;return [...new Set(pool.flatMap(e=>(e.keyframes||[]).map(k=>k.frame)))].sort((a,b)=>a-b);}
function tlPrevKF(){const s=st();if(!s)return;const frames=tlKFFrames().filter(f=>f<s.tlFrame);if(frames.length)tlSeek(frames[frames.length-1]);}
function tlNextKF(){const s=st();if(!s)return;const frames=tlKFFrames().filter(f=>f>s.tlFrame);if(frames.length)tlSeek(frames[0]);}
function renderOnion(){document.querySelectorAll('.onion').forEach(g=>g.remove());if(!document.getElementById('tlonion').checked)return;const s=st();if(!s)return;[-2,-1,1,2].forEach(off=>{const gf=s.tlFrame+off;if(gf<0||gf>=s.tlTotal)return;const alpha=Math.abs(off)===1?.22:.09;s.elements.forEach(el=>{if(el.type==='obj'||el.type==='gif')return;if(!el.perpetuo&&(gf<el.frameIn||gf>el.frameOut))return;const kf=el.keyframes?.length?getInterp(el,gf):null;const gx=kf?kf.x:el.x,gy=kf?kf.y:el.y,gw=kf?kf.w:el.w,gh=kf?kf.h:el.h,gr=kf?kf.rot:el.rotation;const g=document.createElement('div');g.className='onion';g.style.cssText=`left:${gx}px;top:${gy}px;width:${gw}px;height:${gh}px;z-index:${el.z-1};opacity:${alpha};filter:${off<0?'hue-rotate(200deg)':'hue-rotate(100deg)'};transform:rotate(${gr||0}deg);`;if(el.type==='text'||el.type==='note'){g.style.background=off<0?'rgba(100,100,255,.15)':'rgba(100,255,100,.15)';}else{const img=document.createElement('img');img.src=el.src||'';img.draggable=false;g.appendChild(img);}cv().appendChild(g);});});}

// -----------------------------------
// SAVE / LOAD PROJECT
// -----------------------------------
async function saveProject(){
  const s=st();if(!s)return;
  const pname=(gp()?.name||'projeto').replace(/\s+/g,'-').toLowerCase();
  if(window.showDirectoryPicker){
    try{
      const dir=await window.showDirectoryPicker({mode:'readwrite'});
      let pdir;try{pdir=await dir.getDirectoryHandle(pname,{create:true});}catch(e){pdir=dir;}
      const adir=await pdir.getDirectoryHandle('assets',{create:true});
      const fdir=await pdir.getDirectoryHandle('fonts',{create:true});
      // save assets
      for(const el of s.elements){if(el.src&&el.fileName){try{const res=await fetch(el.src);const blob=await res.blob();const fh=await adir.getFileHandle(el.fileName,{create:true});const w=await fh.createWritable();await w.write(blob);await w.close();}catch(e){}}}
      // save fonts
      for(const f of(s.fonts||[])){try{const res=await fetch(f.src);const blob=await res.blob();const fh=await fdir.getFileHandle(f.fileName,{create:true});const w=await fh.createWritable();await w.write(blob);await w.close();}catch(e){}}
      // project.json
      const exp={projectName:gp()?.name,state:{...s,elements:s.elements.map(el=>({...el,src:el.fileName?'assets/'+el.fileName:null,objText:undefined,_3dOn:undefined})),fonts:(s.fonts||[]).map(f=>({...f,src:'fonts/'+f.fileName})),undoStack:[],redoStack:[]}};
      const jfh=await pdir.getFileHandle('project.json',{create:true});const jw=await jfh.createWritable();await jw.write(JSON.stringify(exp,null,2));await jw.close();
      toast('Projeto salvo: '+pname+'/');
    }catch(e){if(e.name!=='AbortError')toast('Erro: '+e.message);}
  } else {
    const exp={projectName:gp()?.name,state:{...s,undoStack:[],redoStack:[]}};
    const blob=new Blob([JSON.stringify(exp,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=pname+'.lbproject.json';a.click();URL.revokeObjectURL(url);
    toast('Salvo (fallback JSON)');
  }
}
function triggerLoadProject(){document.getElementById('fi-proj').click();}
async function loadProjectFolder(e){
  const files=[...e.target.files];if(!files.length)return;
  const jf=files.find(f=>f.name==='project.json')||files.find(f=>f.name.endsWith('.lbproject.json'));
  if(!jf){toast('project.json nao encontrado');e.target.value='';return;}
  let data;try{data=JSON.parse(await jf.text());}catch(err){toast('JSON invalido');e.target.value='';return;}
  const state=data.state||data;
  const af={};files.forEach(f=>af[f.name]=f);
  for(const el of state.elements||[]){if(el.src&&el.src.startsWith('assets/')&&el.fileName&&af[el.fileName]){el.src=await readFile(af[el.fileName]);}}
  for(const f of state.fonts||[]){if(f.src&&f.src.startsWith('fonts/')&&f.fileName&&af[f.fileName]){f.src=await readFile(af[f.fileName]);}}
  const id='p'+Date.now();projects.push({id,name:data.projectName||'Importado',state:{...state,undoStack:[],redoStack:[]}});
  switchTab(id);e.target.value='';toast('Projeto carregado!');
}
function readFile(f){return new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(f);});}

// -----------------------------------
// IMPORT LAYOUT JSON
// -----------------------------------
function triggerLoadJSON(){document.getElementById('fi-json').click();}
async function loadLayoutJSON(e){
  const f=e.target.files[0];if(!f)return;
  let data;try{data=JSON.parse(await f.text());}catch(err){toast('JSON invalido');e.target.value='';return;}
  const canvas=data.canvas||data.meta?.screen||{};
  const timeline=data.timeline||data.meta?.timeline||{};
  const interactions=data.interactions||[];
  const elements=(data.elements||[]).map((el,i)=>{
    const text=el.text||{};const tl=el.timeline||{};const id=el.id||'e'+(Date.now()+i);
    return {id,name:el.name||'Elemento',fileName:el.file||'',src:null,type:el.type||'img',x:el.position?.x||0,y:el.position?.y||0,w:el.size?.width||200,h:el.size?.height||150,z:el.layer_order||100,rotation:el.rotation||0,opacity:el.opacity??1,desc:el.description||el.comments?.[0]?.text||'',visible:el.visible!==false,locked:el.locked||false,group:el.group_name||'',semanticRole:el.semantic_role||'',constraints:el.constraints||{x:'left',y:'top'},states:el.states||{normal:true},componentName:el.component_name||'',frameIn:tl.frame_in??0,frameOut:tl.frame_out??((timeline.total_frames||120)-1),perpetuo:(tl.perpetual??tl.perpetuo)!==false,gifMode:tl.gif_mode||'loop',colorVar:text.color_var||el.color_var||'',textContent:text.content||el.text_content||el.note_content||'',fontFamily:text.font_family||el.font_family||'system-ui',fontSize:text.font_size||el.font_size||16,fontWeight:text.font_weight||el.font_weight||'400',fontColor:text.font_color||el.font_color||'#111111',textAlign:text.text_align||el.text_align||'left',keyframes:(el.keyframes||[]).map(kf=>({frame:kf.frame,x:kf.x||0,y:kf.y||0,w:kf.width||100,h:kf.height||100,rot:kf.rotation||0,ease:kf.ease||'linear'})),actions:{click:{enabled:false,desc:'',swap:false,swapTarget:''},hover:{enabled:false,desc:'',swap:false,swapTarget:''}}};
  });
  interactions.forEach(int=>{const el=elements.find(e=>String(e.id)===String(int.element_id));if(!el||!['click','hover'].includes(int.event))return;el.actions[int.event]={enabled:true,desc:int.description||'',swap:!!int.swap_with,swapTarget:int.swap_with?.element_id||''};});
  const state=hydrateState({...newState(),elements,screenW:canvas.width||1920,screenH:canvas.height||1080,screens:canvas.screens||data.meta?.screens||[{id:1,name:'Tela 1',type:'page',h:canvas.height||1080}],guides:canvas.guides||data.meta?.guides||{h:[],v:[]},tlActive:!!timeline.active,tlTotal:timeline.total_frames||120,tlFPS:timeline.fps||24,colorVars:canvas.color_vars||data.meta?.color_vars||[],nextId:elements.length+1});
  const id='p'+Date.now();projects.push({id,name:f.name.replace('.json',''),state});
  switchTab(id);e.target.value='';toast('Layout JSON importado - adicione assets se necessario');
}

