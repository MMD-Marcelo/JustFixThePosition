// -----------------------------------// CTX MENU
// -----------------------------------
function showCtx(x,y){const m=document.getElementById('ctx');m.style.display='block';m.style.left=x+'px';m.style.top=y+'px';}
function hideCtx(){document.getElementById('ctx').style.display='none';}
function showToolCtx(x,y){const m=document.getElementById('toolctx');hideCtx();m.style.display='block';m.style.left=x+'px';m.style.top=y+'px';}
function hideToolCtx(){document.getElementById('toolctx').style.display='none';}
function openBrushToolMenu(e,t){e.preventDefault();e.stopPropagation();setTool(t);showToolCtx(e.clientX,e.clientY);}
function ctxBrushNewLayer(){hideToolCtx();brushNewLayerNext=true;['tool-brush','tool-brush-soft','tool-eraser'].forEach(id=>document.getElementById(id)?.classList.add('armed'));toast('Próximo traço cria uma nova Brush Layer');}
function ctxDup(){hideCtx();copyEl();pasteEl();}
function ctxReplaceExisting(){
  hideCtx();const s=st();if(!s||!ctxTgt)return;
  const options=s.elements.filter(e=>e.id!==ctxTgt).map(e=>`<option value="${e.id}">${escH(e.name)}</option>`).join('');
  if(!options){toast('Nenhum outro elemento');return;}
  openM('Substituir por elemento',`<label>Elemento</label><select id="repl-el">${options}</select>`,()=>replaceElementWith(ctxTgt,document.getElementById('repl-el').value));
}
function ctxReplaceUpload(){hideCtx();if(!ctxTgt)return;document.getElementById('fi-replace').click();}
function replaceElementWith(targetId,sourceId){
  const s=st();if(!s)return;const target=s.elements.find(e=>e.id===targetId),src=s.elements.find(e=>e.id===sourceId);if(!target||!src)return;pushUndo();
  const keep={id:target.id,x:target.x,y:target.y,w:target.w,h:target.h,z:target.z,group:target.group,frameIn:target.frameIn,frameOut:target.frameOut,perpetuo:target.perpetuo,keyframes:target.keyframes,actions:target.actions};
  Object.assign(target,JSON.parse(JSON.stringify(src)),keep,{name:target.name+' -> '+src.name});
  document.getElementById('el-'+target.id)?.remove();
  renderEl(target);updateLayers();renderAssets();buildTL();saveLs();toast('Elemento substituído');
}
function replaceTargetWithUpload(e){
  const file=e.target.files[0],s=st(),target=s?.elements.find(el=>el.id===ctxTgt);if(!file||!s||!target){e.target.value='';return;}
  pushUndo();const ext=file.name.split('.').pop().toLowerCase();const r=new FileReader();
  r.onload=ev=>{target.fileName=file.name;target.name=inferName(file.name,ext==='gif'?'gif':ext==='svg'?'svg':ext==='obj'?'obj':'img');target.type=ext==='obj'?'obj':file.type==='image/svg+xml'?'svg':ext==='gif'?'gif':'img';target.src=ext==='obj'?null:ev.target.result;if(ext==='obj')target.objText=ev.target.result;target.semanticRole=target.semanticRole||'media';document.getElementById('el-'+target.id)?.remove();renderEl(target);updateLayers();renderAssets();buildTL();saveLs();toast('Substituto aplicado');};
  if(ext==='obj')r.readAsText(file);else r.readAsDataURL(file);e.target.value='';
}
function ctxLock(){hideCtx();const s=st();if(!s||!ctxTgt)return;const el=s.elements.find(x=>x.id===ctxTgt);if(!el)return;el.locked=!el.locked;renderEl(el);updateLayers();saveLs();toast(el.locked?'Bloqueado':'Desbloqueado');}
function ctxFront(){hideCtx();const s=st();if(!s||!sel.length)return;pushUndo();sel.forEach(id=>{const el=s.elements.find(x=>x.id===id);if(el){el.z=Math.max(...s.elements.map(e=>e.z))+1;renderEl(el);}});saveLs();}
function ctxBack(){hideCtx();const s=st();if(!s||!sel.length)return;pushUndo();sel.forEach(id=>{const el=s.elements.find(x=>x.id===id);if(el){el.z=Math.max(1,Math.min(...s.elements.map(e=>e.z))-1);renderEl(el);}});saveLs();}
function ctxDel(){hideCtx();[...sel].forEach(id=>deleteEl(id));}
function deleteEl(id){const s=st();if(!s)return;pushUndo();const el=s.elements.find(x=>x.id===id);if(el&&el.type==='obj')el._3dOn=false;s.elements=s.elements.filter(x=>x.id!==id);const d=document.getElementById('el-'+id);if(d)d.remove();sel=sel.filter(x=>x!==id);if(!sel.length)deselAll();else updateLayers();renderAssets();buildTL();drawMM();if(!s.elements.length)cv().classList.remove('has-el');saveLs();}
function clearAll(){openM('Limpar','<p style="color:var(--a2);font-size:12px;margin-top:4px">Remover todos os elementos?</p>',()=>{const s=st();if(!s)return;pushUndo();s.elements.forEach(el=>{if(el.type==='obj')el._3dOn=false;});s.elements=[];document.querySelectorAll('.el,.onion,.gbox').forEach(d=>d.remove());deselAll();updateLayers();buildTL();cv().classList.remove('has-el');drawMM();saveLs();toast('Canvas limpo');});}

// -----------------------------------
// EXPORT JSON
// -----------------------------------
let lastExportPayload=null;
function openExportModal(){const s=st();if(!s)return;openM('Exportar JSON',`<label>Modo</label><select id="emode"><option value="screen">Tela completa</option><option value="element">Elemento especifico</option></select><label>Perfil</label><select id="eprofile"><option value="generic-llm">LLM generico</option><option value="react">React</option><option value="tailwind">Tailwind</option><option value="flutter">Flutter</option><option value="html-css">HTML/CSS</option></select><div id="ewrap" style="display:none"><label>Elemento</label><select id="esel">${s.elements.map(e=>`<option value="${e.id}">${escH(e.name)}</option>`).join('')}</select><label>Nome</label><input id="ename" placeholder="botao-primario"></div><label>Checklist</label><div id="ewarnings" class="warning-list"></div><label>Preview</label><textarea id="epreview" readonly style="min-height:220px;font-family:var(--mono);font-size:10px"></textarea><div class="mrow"><button class="mbtn" type="button" onclick="previewExport()">Atualizar preview</button><button class="mbtn" type="button" onclick="copyExport()">Copiar prompt + JSON</button><button class="mbtn ok" type="button" onclick="downloadExport()">Baixar JSON</button></div>`,()=>{});document.getElementById('emode').onchange=function(){document.getElementById('ewrap').style.display=this.value==='element'?'':'none';previewExport();};document.getElementById('eprofile').onchange=previewExport;previewExport();}
function exportSelection(){const mode=document.getElementById('emode')?.value||'screen';return{mode,profile:document.getElementById('eprofile')?.value||'generic-llm',elId:mode==='element'?document.getElementById('esel')?.value:null,elName:mode==='element'?document.getElementById('ename')?.value:''};}
function previewExport(){const {mode,elId,elName,profile}=exportSelection();lastExportPayload=buildExportPayload(mode,elId,elName,profile);const out=document.getElementById('epreview');if(out)out.value=JSON.stringify(lastExportPayload,null,2);renderExportWarnings(lastExportPayload.warnings||[]);}
function copyExport(){if(!lastExportPayload)previewExport();const text=(lastExportPayload._instructions_for_llm||'')+'\n\n'+JSON.stringify(lastExportPayload,null,2);if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>toast('Prompt + JSON copiados')).catch(()=>fallbackCopy(text));}else fallbackCopy(text);}
function fallbackCopy(text){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Prompt + JSON copiados');}
function downloadExport(){if(!lastExportPayload)previewExport();const {mode,elName}=exportSelection();const fname=(mode==='element'?(elName||'elemento'):(gp()?.name||'layout')).replace(/\s+/g,'-').toLowerCase()+'.json';const blob=new Blob([JSON.stringify(lastExportPayload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fname;a.click();URL.revokeObjectURL(url);toast('Exportado: '+fname);}
function doExport(mode,elId,elName){lastExportPayload=buildExportPayload(mode,elId,elName,'generic-llm');downloadExport();}
function renderExportWarnings(warnings){const box=document.getElementById('ewarnings');if(!box)return;box.innerHTML=warnings.length?warnings.map((w,i)=>`<button class="warn-item" type="button" onclick="selectWarningElement('${w.element_id||''}')">${i+1}. ${escH(w.type)} - ${escH(w.message)}</button>`).join(''):'<div class="hist-item">Checklist OK</div>';}
function selectWarningElement(id){if(!id)return;selOne(id);}
function buildExportPayload(mode='screen',elId=null,elName='',profile='generic-llm'){
  const s=st();if(!s)return{};const W=cW(),H=cH(),fps=s.tlFPS||24;const selected=mode==='element'?s.elements.filter(e=>String(e.id)===String(elId)):s.elements;const warnings=validateLayout(selected);
  const assetMap=new Map();selected.forEach(el=>{if(el.fileName&&!assetMap.has(el.fileName)){assetMap.set(el.fileName,{id:'asset_'+(assetMap.size+1),file:el.fileName,type:el.type,source:el.src?'embedded-or-project-asset':null});}});
  const assets=[...assetMap.values()];
  const elements=selected.map(el=>elementExport(el,s,W,H,fps,assets)).map(cleanObj);
  const interactions=[];selected.forEach(el=>{['click','hover'].forEach(kind=>{const action=el.actions?.[kind];if(action?.enabled){const target=s.elements.find(e=>String(e.id)===String(action.swapTarget));interactions.push(cleanObj({element_id:el.id,event:kind,description:action.desc||'',swap_with:action.swap?{element_id:target?.id,name:target?.name,file:target?.fileName,type:target?.type}:undefined}));}});});
  const instructions=profileInstructions(profile);
  const timeline=s.tlActive?{active:true,total_frames:s.tlTotal,fps,duration_seconds:frameSec(s.tlTotal,fps),loop:document.getElementById('tlloop')?.checked!==false,auto_keyframe:!!s.tlAutoKF}:{active:false};
  const canvas={type:s.screenType,width:W,height:s.screenH,total_height:H,screens:s.screens.map(sc=>({name:sc.name,type:sc.type,width:sc.w||s.screenW,height:sc.h||s.screenH})),guides:s.guides,color_vars:s.colorVars||[]};
  const llmBrief=buildLLMBrief({mode,profile,projectName:mode==='element'?elName||selected[0]?.name:gp()?.name,canvas,assets,elements,interactions,timeline,warnings});
  return cleanObj({schema_version:SCHEMA_VERSION,app:APP_ID,_instructions_for_llm:instructions,llm_brief:llmBrief,exported_at:new Date().toISOString(),export:{type:mode,name:mode==='element'?elName||undefined:gp()?.name,profile,interface_language:s.lang||lang()},canvas,assets,elements,interactions,components:s.components||[],timeline,warnings});
}
function profileInstructions(profile){const base='Use este JSON como especificação visual do JUST fix the position. Respeite canvas, tracking, posições, porcentagens, layer_order, assets, semântica, constraints, estados, interações e timeline. Não invente layout quando houver coordenadas explícitas.';const map={react:'Gere componentes React preservando semantic_role, component_name e states.',tailwind:'Gere HTML/React com Tailwind preservando constraints responsivas como classes.',flutter:'Gere widgets Flutter respeitando Stack/Positioned, constraints e timeline quando houver.', 'html-css':'Gere HTML/CSS simples com posicionamento fiel e comentários das interações.'};return base+' '+(map[profile]||'');}
function buildLLMBrief({mode,profile,projectName,canvas,assets,elements,interactions,timeline,warnings}){
  const visible=elements.filter(e=>e.visible!==false).sort((a,b)=>(a.layer_order||0)-(b.layer_order||0));
  const byImportance=[...visible].sort((a,b)=>elementImportance(b)-elementImportance(a));
  const groups=groupElementsForLLM(visible);
  const top=byImportance.slice(0,8);
  const animated=visible.filter(e=>e.timeline?.perpetual===false||e.keyframes?.length);
  const missing=warnings.map(w=>`${w.type}: ${w.message}${w.element_name?' ('+w.element_name+')':''}`);
  return {
    goal:'Recriar esta interface com fidelidade visual usando os elementos, posições, camadas, assets, estados, interações e timeline deste JSON.',
    project_name:projectName||'Projeto',
    export_mode:mode,
    target_profile:profile,
    implementation_priority:[
      'Preserve position.x/y, size.width/height, bounds, rotation, opacity and layer_order before making aesthetic guesses.',
      'Use semantic_role and component_name to choose real UI tags/components, but keep explicit coordinates as the source of truth.',
      'Use tracking.layout and tracking.raw when there is any doubt about the exact values.',
      'Do not invent missing layout when coordinates, constraints, states, interactions or timeline data are present.',
      'If warnings exist, implement the closest faithful version and report the ambiguity.'
    ],
    coordinate_system:{
      origin:'top-left',
      unit:'px',
      canvas_width:canvas.width,
      canvas_height:canvas.height,
      total_height:canvas.total_height,
      z_order:'Higher layer_order should render above lower layer_order.'
    },
    screen_summary:summarizeScreen(canvas,visible),
    layout_rules:[
      'Elements are absolutely positioned unless constraints explicitly suggest responsive behavior.',
      'Use bounds for collision/spacing checks and position/size for CSS values.',
      'Keep elements inside their parent screen region when generating responsive variants.',
      'Respect crop.cutouts, crop.pasted_fragments and crop.fragment when reconstructing edited image regions.',
      'Brush strokes are visual annotations and should be reproduced as overlay/vector/canvas marks when relevant.'
    ],
    visual_hierarchy:top.map((e,i)=>({
      level:i+1,
      id:e.id,
      name:e.name,
      role:e.semantic_role||e.type,
      component:e.component_name||e.group_name||undefined,
      reason:importanceReason(e),
      bounds:e.bounds,
      layer_order:e.layer_order
    })),
    component_plan:groups.map(g=>({
      name:g.name,
      source:g.source,
      element_ids:g.items.map(e=>e.id),
      element_names:g.items.map(e=>e.name),
      suggested_output:suggestComponentOutput(g)
    })),
    asset_instructions:assets.map(a=>({
      id:a.id,
      file:a.file,
      type:a.type,
      usage:visible.filter(e=>e.asset_id===a.id||e.file===a.file).map(e=>e.name)
    })),
    interaction_summary:interactions.map(int=>({
      element_id:int.element_id,
      event:int.event,
      expected_behavior:int.description||'Interaction enabled without written description.',
      swap_with:int.swap_with||undefined
    })),
    timeline_summary:timeline.active?animated.map(e=>({
      element_id:e.id,
      name:e.name,
      playback:e.timeline,
      keyframes:e.keyframes||[],
      instruction:e.keyframes?.length?`Animate ${e.name} by interpolating the listed keyframes and easing values.`:`Show ${e.name} according to frame_in/frame_out.`
    })):[{instruction:'No timeline is active; render the static layout.'}],
    states_summary:visible.filter(e=>e.states&&Object.keys(e.states).length).map(e=>({element_id:e.id,name:e.name,states:e.states})),
    ambiguities:missing,
    final_instruction:'Return an implementation that follows this JSON as a visual contract. Prefer faithful layout over creative redesign.'
  };
}
function elementImportance(e){
  const role=(e.semantic_role||e.type||'').toLowerCase(),name=(e.name||'').toLowerCase();
  const roleScore={hero:80,heading:75,nav:70,modal:68,button:58,input:48,card:44,table:42,media:36,text:30,note:10,brush:8};
  const area=((e.size?.width||0)*(e.size?.height||0))/1000;
  const topBonus=(e.position?.y||0)<160?18:0;
  const nameBonus=/hero|title|cta|nav|modal|header/i.test(name)?16:0;
  return (roleScore[role]||24)+Math.min(area,60)+topBonus+nameBonus+(e.layer_order||0)/1000;
}
function importanceReason(e){
  const role=e.semantic_role||e.type;
  if(['hero','heading','nav','modal','button'].includes(role))return `High semantic priority: ${role}.`;
  if((e.position?.y||0)<160)return 'Appears near the top of the canvas.';
  if((e.size?.width||0)*(e.size?.height||0)>120000)return 'Large visual footprint.';
  return 'Included because it contributes visible structure or content.';
}
function groupElementsForLLM(elements){
  const map=new Map();
  elements.forEach(e=>{
    const name=e.component_name||e.group_name;
    if(!name)return;
    const key=(e.component_name?'component:':'group:')+name;
    if(!map.has(key))map.set(key,{name,source:e.component_name?'component_name':'group_name',items:[]});
    map.get(key).items.push(e);
  });
  return [...map.values()].filter(g=>g.items.length>1).sort((a,b)=>b.items.length-a.items.length);
}
function suggestComponentOutput(group){
  const roles=new Set(group.items.map(e=>e.semantic_role||e.type));
  if(roles.has('nav'))return 'Create a navigation/header component preserving link order and CTA placement.';
  if(roles.has('hero'))return 'Create a hero/section component preserving copy, media and CTA positions.';
  if(roles.has('modal'))return 'Create a modal/dialog component with close/action elements.';
  if(roles.has('table'))return 'Create a table-like component using rows and columns from text content.';
  return 'Create a reusable component containing these positioned child elements.';
}
function summarizeScreen(canvas,elements){
  const roles=[...new Set(elements.map(e=>e.semantic_role||e.type).filter(Boolean))].slice(0,10).join(', ')||'no elements';
  const count=elements.length;
  const screens=(canvas.screens||[]).map(sc=>`${sc.name||'screen'}:${sc.type||canvas.type}`).join(', ');
  return `${canvas.type} canvas ${canvas.width}x${canvas.total_height}. ${count} visible element(s). Screens: ${screens}. Main roles/types: ${roles}.`;
}
function elementExport(el,s,W,H,fps,assets){const assetId=el.fileName?(assets.find(a=>a.file===el.fileName)?.id||null):null;const cropData={enabled:!!el.crop,cutouts:el.cutouts||[],pasted_fragments:el.pastedFragments||[],fragment:el.cropFragment||undefined};const base={id:el.id,name:el.name,type:el.type,semantic_role:el.semanticRole||undefined,component_name:el.componentName||undefined,asset_id:assetId,file:el.fileName||undefined,position:{x:Math.round(el.x),y:Math.round(el.y),x_pct:+(el.x/W*100).toFixed(2),y_pct:+(el.y/H*100).toFixed(2)},size:{width:Math.round(el.w),height:Math.round(el.h),w_pct:+(el.w/W*100).toFixed(2),h_pct:+(el.h/H*100).toFixed(2)},bounds:{left:Math.round(el.x),top:Math.round(el.y),right:Math.round(el.x+el.w),bottom:Math.round(el.y+el.h),center_x:Math.round(el.x+el.w/2),center_y:Math.round(el.y+el.h/2)},constraints:el.constraints||{x:'left',y:'top'},states:el.states||{},rotation:el.rotation||0,layer_order:el.z,opacity:+(el.opacity??1).toFixed(2),visible:el.visible,locked:el.locked,crop:cropData,group_name:el.group||undefined,description:el.desc||undefined,comments:el.desc?[{type:'designer_note',text:el.desc}]:undefined,text:['text','note','shape'].includes(el.type)?{content:el.textContent||'',font_family:el.fontFamily,font_size:el.fontSize,font_weight:el.fontWeight,font_color:el.fontColor,text_align:el.textAlign,color_var:el.colorVar||undefined}:undefined,shape:el.type==='shape'?{variant:el.shapeVariant||'',style:el.shapeStyle||{}}:undefined,brush:(el.brushStrokes||[]).length?{strokes:el.brushStrokes}:undefined,timeline:s.tlActive?{perpetual:!!el.perpetuo,frame_in:el.perpetuo?null:(el.frameIn??0),frame_out:el.perpetuo?null:(el.frameOut??(s.tlTotal-1)),duration_seconds:el.perpetuo?null:frameSec((el.frameOut??(s.tlTotal-1))-(el.frameIn??0)+1,fps),gif_mode:el.type==='gif'?(el.gifMode||'loop'):undefined}:undefined,keyframes:(el.keyframes||[]).map(kf=>({frame:kf.frame,time_seconds:frameSec(kf.frame,fps),x:Math.round(kf.x),y:Math.round(kf.y),width:Math.round(kf.w),height:Math.round(kf.h),rotation:kf.rot||0,ease:kf.ease||'linear'}))};base.tracking={identity:{id:base.id,name:base.name,type:base.type,semantic_role:base.semantic_role,component_name:base.component_name},layout:{position:base.position,size:base.size,bounds:base.bounds,rotation:base.rotation,layer_order:base.layer_order,constraints:base.constraints,crop:base.crop},state:{visible:base.visible,locked:base.locked,opacity:base.opacity,states:base.states},content:{description:base.description,text:base.text,shape:base.shape,brush:base.brush,asset_id:base.asset_id,file:base.file},behavior:{actions:el.actions,timeline:base.timeline,keyframes:base.keyframes},relationships:{group_name:base.group_name,swap_targets:Object.fromEntries(['click','hover'].map(k=>[k,el.actions?.[k]?.swapTarget||null]))},raw:{id:el.id,name:el.name,fileName:el.fileName,type:el.type,x:el.x,y:el.y,w:el.w,h:el.h,z:el.z,rotation:el.rotation,opacity:el.opacity,desc:el.desc,visible:el.visible,locked:el.locked,crop:el.crop,cutouts:el.cutouts,pastedFragments:el.pastedFragments,cropFragment:el.cropFragment,group:el.group,semanticRole:el.semanticRole,constraints:el.constraints,states:el.states,componentName:el.componentName,shapeVariant:el.shapeVariant,shapeStyle:el.shapeStyle,brushStrokes:el.brushStrokes,frameIn:el.frameIn,frameOut:el.frameOut,perpetuo:el.perpetuo,gifMode:el.gifMode,colorVar:el.colorVar,textContent:el.textContent,fontFamily:el.fontFamily,fontSize:el.fontSize,fontWeight:el.fontWeight,fontColor:el.fontColor,textAlign:el.textAlign,keyframes:el.keyframes,actions:el.actions}};return base;}
function validateLayout(elements){
  const s=st(),warnings=[];if(!s)return warnings;
  const zSeen=new Map(),nameSeen=new Map(),allIds=new Set((s.elements||[]).map(e=>String(e.id)));
  if(!elements.length)warnings.push({severity:'error',type:'empty_export',message:'Nenhum elemento selecionado para exportar.',fix:'Adicione elementos ou exporte a tela correta.'});
  elements.forEach(el=>{
    const base={element_id:el.id,element_name:el.name};
    if(!el.name||/^elemento?$|^image$|^img$/i.test(el.name))warnings.push({...base,severity:'warning',type:'weak_element_name',message:'Nome pouco descritivo para a LLM.',fix:'Renomeie a camada com a função visual do elemento.'});
    const nameKey=(el.name||'').trim().toLowerCase();if(nameKey){if(nameSeen.has(nameKey))warnings.push({...base,severity:'warning',type:'duplicate_element_name',message:'Nome duplicado com '+nameSeen.get(nameKey)+'.',fix:'Use nomes únicos para facilitar referência no código.'});else nameSeen.set(nameKey,el.id);}
    if(!['text','note','shape','brush'].includes(el.type)&&!el.fileName)warnings.push({...base,severity:'error',type:'asset_missing_name',message:'Elemento visual sem nome de arquivo.',fix:'Associe um asset ou renomeie o arquivo importado.'});
    if(['text','note','shape'].includes(el.type)&&!String(el.textContent||'').trim()&&!['card','media'].includes(el.shapeVariant))warnings.push({...base,severity:'warning',type:'empty_text_content',message:'Elemento textual sem conteúdo.',fix:'Preencha o texto ou descreva a intenção.'});
    if(!el.semanticRole&&['shape','img','svg','gif','obj'].includes(el.type))warnings.push({...base,severity:'info',type:'missing_semantic_role',message:'Elemento sem semantic_role.',fix:'Defina button, input, card, nav, modal, hero, media etc.'});
    if(el.x<0||el.y<0||el.x+el.w>cW()||el.y+el.h>cH())warnings.push({...base,severity:'error',type:'outside_canvas',message:'Elemento passa dos limites do canvas.',fix:'Reposicione ou ajuste o tamanho antes do export.'});
    if(el.w<1||el.h<1)warnings.push({...base,severity:'error',type:'invalid_size',message:'Elemento com tamanho inválido.',fix:'Defina width e height maiores que zero.'});
    if(zSeen.has(el.z))warnings.push({...base,severity:'warning',type:'duplicate_layer_order',message:'layer_order duplicado com '+zSeen.get(el.z),fix:'Reordene camadas para z/layer_order único.'});else zSeen.set(el.z,el.id);
    ['click','hover'].forEach(kind=>{const a=el.actions?.[kind];if(a?.enabled&&!a.desc&&!a.swap)warnings.push({...base,severity:'warning',type:'incomplete_action',message:'Ação '+kind+' sem descrição ou swap.',fix:'Descreva o comportamento esperado.'});if(a?.enabled&&a.swap&&!a.swapTarget)warnings.push({...base,severity:'error',type:'missing_swap_target',message:'Ação '+kind+' sem alvo de substituição.',fix:'Escolha um elemento substituto.'});if(a?.enabled&&a.swapTarget&&!allIds.has(String(a.swapTarget)))warnings.push({...base,severity:'error',type:'broken_swap_target',message:'Ação '+kind+' aponta para um elemento inexistente.',fix:'Escolha novamente o alvo de substituição.'});});
    if(s.tlActive&&!el.perpetuo){if((el.frameIn??0)<0||(el.frameOut??0)>=s.tlTotal||el.frameIn>=el.frameOut)warnings.push({...base,severity:'error',type:'invalid_timeline_range',message:'Intervalo de timeline inválido.',fix:'Ajuste frame_in e frame_out.'});}
    (el.keyframes||[]).forEach(kf=>{if(kf.frame<0||kf.frame>=s.tlTotal)warnings.push({...base,severity:'error',type:'keyframe_out_of_range',message:'Keyframe fora do total de frames.',fix:'Mova o keyframe para dentro da timeline.'});});
  });
  return warnings;
}
function cleanObj(obj){if(Array.isArray(obj))return obj.map(cleanObj);if(!obj||typeof obj!=='object')return obj;Object.keys(obj).forEach(k=>{if(obj[k]===undefined||obj[k]===null||(Array.isArray(obj[k])&&!obj[k].length))delete obj[k];else obj[k]=cleanObj(obj[k]);});return obj;}

// -----------------------------------// MODAL
// -----------------------------------
function openM(title,body,cb){document.getElementById('mtitle').textContent=title;document.getElementById('mbody').innerHTML=body;modalCb=cb;document.getElementById('mov').classList.add('show');setTimeout(()=>{const f=document.querySelector('#mbody input,#mbody textarea');if(f)f.focus();},50);}
function closeM(){document.getElementById('mov').classList.remove('show');modalCb=null;}
function okM(){if(modalCb)modalCb();closeM();}

// -----------------------------------
// UTILS
// -----------------------------------
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
let toastT;function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200);}
