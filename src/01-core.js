// -----------------------------------
// CONSTANTS
// -----------------------------------
const GRID=8, MAX_UNDO=50, DEFZOOM=75, SCHEMA_VERSION='1.0', APP_ID='just-fix-the-position';
const SCDEF={desktop:{w:1920,h:1080},mobile:{w:393,h:852}};
const BASIC_COMPONENTS=[
  {kind:'accordion',label:'Accordion',badge:'ACC'},
  {kind:'alert',label:'Alert',badge:'ALT'},
  {kind:'avatar',label:'Avatar',badge:'AVA'},
  {kind:'badge',label:'Badge',badge:'BDG'},
  {kind:'breadcrumbs',label:'Breadcrumbs',badge:'BRC'},
  {kind:'button',label:'Button',badge:'BTN'},
  {kind:'button-group',label:'Button group',badge:'BTG'},
  {kind:'input',label:'Input field',badge:'INP'},
  {kind:'card',label:'Card',badge:'CRD'},
  {kind:'carousel',label:'Carousel',badge:'CAR'},
  {kind:'checkbox',label:'Checkbox',badge:'CHK'},
  {kind:'color-picker',label:'Color picker',badge:'CLR'},
  {kind:'combobox',label:'Combobox',badge:'CBX'},
  {kind:'date-input',label:'Date input',badge:'DAT'},
  {kind:'datepicker',label:'Datepicker',badge:'DTP'},
  {kind:'drawer',label:'Drawer',badge:'DRW'},
  {kind:'dropdown',label:'Dropdown menu',badge:'DDM'},
  {kind:'empty-state',label:'Empty state',badge:'EMP'},
  {kind:'fieldset',label:'Fieldset',badge:'FLD'},
  {kind:'file',label:'File',badge:'FIL'},
  {kind:'file-upload',label:'File upload',badge:'UPL'},
  {kind:'footer',label:'Footer',badge:'FTR'},
  {kind:'form',label:'Form',badge:'FRM'},
  {kind:'header',label:'Header',badge:'HDR'},
  {kind:'heading',label:'Heading',badge:'HDG'},
  {kind:'navbar',label:'Navbar',badge:'NAV'},
  {kind:'hero',label:'Hero section',badge:'HRO'},
  {kind:'icon',label:'Icon',badge:'ICO'},
  {kind:'image',label:'Image',badge:'IMG'},
  {kind:'label',label:'Label',badge:'LBL'},
  {kind:'link',label:'Link',badge:'LNK'},
  {kind:'list',label:'List',badge:'LST'},
  {kind:'modal',label:'Modal',badge:'MOD'},
  {kind:'navigation',label:'Navigation',badge:'NAV'},
  {kind:'pagination',label:'Pagination',badge:'PAG'},
  {kind:'popover',label:'Popover',badge:'POP'},
  {kind:'progress-bar',label:'Progress bar',badge:'PRG'},
  {kind:'progress-indicator',label:'Progress indicator',badge:'STP'},
  {kind:'quote',label:'Quote',badge:'QTE'},
  {kind:'radio',label:'Radio group',badge:'RDO'},
  {kind:'rating',label:'Rating',badge:'RAT'},
  {kind:'rich-text-editor',label:'Rich text editor',badge:'RTE'},
  {kind:'search-input',label:'Search input',badge:'SRC'},
  {kind:'segmented-control',label:'Segmented control',badge:'SEG'},
  {kind:'select',label:'Select',badge:'SEL'},
  {kind:'separator',label:'Separator',badge:'SEP'},
  {kind:'skeleton',label:'Skeleton',badge:'SKL'},
  {kind:'skip-link',label:'Skip link',badge:'SKP'},
  {kind:'slider',label:'Slider',badge:'SLD'},
  {kind:'spinner',label:'Spinner',badge:'SPN'},
  {kind:'stack',label:'Stack',badge:'STK'},
  {kind:'stepper',label:'Stepper',badge:'NDR'},
  {kind:'table',label:'Table',badge:'TBL'},
  {kind:'tabs',label:'Tabs',badge:'TAB'},
  {kind:'text-input',label:'Text input',badge:'TXT'},
  {kind:'textarea',label:'Textarea',badge:'TXA'},
  {kind:'toast',label:'Toast',badge:'TST'},
  {kind:'toggle',label:'Toggle',badge:'TGL'},
  {kind:'tooltip',label:'Tooltip',badge:'TIP'},
  {kind:'tree-view',label:'Tree view',badge:'TRE'},
  {kind:'video',label:'Video',badge:'VID'},
  {kind:'visually-hidden',label:'Visually hidden',badge:'VH'},
  {kind:'dashboard-card',label:'Metric card',badge:'KPI'}
];
const COMPONENT_PRESETS={
  accordion:{w:360,h:190,text:'Account settings | Change email, password, and billing details\nNotifications | Choose which updates you receive\nDanger zone | Export or delete workspace data',role:'accordion'},
  alert:{w:380,h:82,text:'Payment failed\nUpdate the card before the next billing attempt.',role:'alert'},
  avatar:{w:72,h:72,text:'JF',role:'avatar'},
  badge:{w:108,h:30,text:'Published',role:'badge'},
  breadcrumbs:{w:380,h:40,text:'Home | Projects | Current file',role:'breadcrumbs'},
  'button-group':{w:300,h:44,text:'Preview | Code | Export',role:'toolbar'},
  carousel:{w:440,h:250,text:'Featured template\nDesktop dashboard layout',role:'carousel'},
  checkbox:{w:240,h:38,text:'[x] Auto-save project',role:'checkbox'},
  'color-picker':{w:230,h:46,text:'#ff3033',role:'color-picker'},
  combobox:{w:320,h:44,text:'Search components...',role:'combobox'},
  'date-input':{w:230,h:44,text:'25 / 07 / 2026',role:'date-input'},
  datepicker:{w:300,h:260,text:'July 2026\nMo Tu We Th Fr Sa Su\n20 21 22 23 24 25 26',role:'datepicker'},
  drawer:{w:320,h:420,text:'Project menu\nOverview\nComponents\nAssets\nSettings',role:'drawer'},
  dropdown:{w:250,h:164,text:'Actions\nRename\nDuplicate\nReplace component\nDelete',role:'dropdown'},
  'empty-state':{w:380,h:220,text:'No assets yet\nImport images, SVG, GIF or OBJ\nImport asset',role:'empty-state'},
  fieldset:{w:340,h:190,text:'Contact details\nName\nEmail\nPhone',role:'fieldset'},
  file:{w:300,h:66,text:'layout-spec.json\n24 KB',role:'file'},
  'file-upload':{w:380,h:180,text:'Drop files here\nor browse your device',role:'file-upload'},
  footer:{w:760,h:96,text:'© 2026 Company | Privacy | Terms | Contact',role:'footer'},
  form:{w:380,h:310,text:'Create account\nName\nEmail\nPassword\nCreate account',role:'form'},
  header:{w:760,h:72,text:'JUST | Templates | Components | Export',role:'header'},
  heading:{w:440,h:68,text:'Design system components',role:'heading',fontSize:28,fontWeight:'800'},
  icon:{w:56,h:56,text:'★',role:'icon'},
  image:{w:340,h:210,text:'Cover image',role:'image'},
  label:{w:140,h:28,text:'Email address',role:'label'},
  link:{w:190,h:32,text:'View documentation',role:'link'},
  list:{w:300,h:150,text:'• First item\n• Second item\n• Third item',role:'list'},
  navigation:{w:250,h:230,text:'Overview\nProjects\nAssets\nSettings',role:'navigation'},
  pagination:{w:280,h:42,text:'‹ 1 2 3 4 ›',role:'pagination'},
  popover:{w:270,h:160,text:'Component details\nReusable block with editable text\nOpen settings',role:'popover'},
  'progress-bar':{w:340,h:42,text:'68%',role:'progress-bar'},
  'progress-indicator':{w:380,h:60,text:'Cart > Shipping > Payment',role:'progress-indicator'},
  quote:{w:380,h:145,text:'“Design is a contract with the user.”\n- Author',role:'quote'},
  radio:{w:250,h:112,text:'( ) Small\n(o) Medium\n( ) Large',role:'radio'},
  rating:{w:190,h:38,text:'★★★★☆',role:'rating'},
  'rich-text-editor':{w:440,h:230,text:'B I U | H1 | Link\n\nEditable rich text area',role:'rich-text-editor'},
  'search-input':{w:320,h:44,text:'Search...',role:'search'},
  'segmented-control':{w:320,h:44,text:'Day | Week | Month',role:'segmented-control'},
  select:{w:270,h:44,text:'Selected option ▼',role:'select'},
  separator:{w:340,h:16,text:'',role:'separator'},
  skeleton:{w:340,h:160,text:'',role:'skeleton'},
  'skip-link':{w:190,h:32,text:'Skip to content',role:'skip-link'},
  slider:{w:340,h:44,text:'72%',role:'slider'},
  spinner:{w:72,h:72,text:'',role:'spinner'},
  stack:{w:300,h:180,text:'Item one\nItem two\nItem three',role:'stack'},
  stepper:{w:170,h:44,text:'-  3  +',role:'stepper'},
  tabs:{w:380,h:190,text:'Overview | Details | Activity\nTab panel content',role:'tabs'},
  'text-input':{w:300,h:44,text:'Text value',role:'text-input'},
  textarea:{w:340,h:125,text:'Longer editable text...',role:'textarea'},
  toast:{w:340,h:66,text:'Saved successfully\nProject JSON updated',role:'toast'},
  toggle:{w:170,h:40,text:'On',role:'toggle'},
  tooltip:{w:230,h:66,text:'Tooltip text\nHelpful microcopy',role:'tooltip'},
  'tree-view':{w:270,h:185,text:'▾ src\n  ▸ components\n  ▸ styles\n  index.html',role:'tree-view'},
  video:{w:380,h:230,text:'Video player',role:'video'},
  'visually-hidden':{w:290,h:40,text:'Screen reader only text',role:'visually-hidden'}
};
const COMPONENT_RENDER_VARIANTS=new Set([...Object.keys(COMPONENT_PRESETS),'toolbar','search']);
const I18N={
  pt:{custom:'Personalizado',history:'Histórico',command_palette_tip:'Paleta de comandos (Ctrl+K)',preview_tip:'Preview sem painéis (P)',history_tip:'Histórico visual',language_tip:'Trocar idioma',rulers:'Réguas',rulers_tip:'Mostrar réguas e criar guias',undo:'Desfazer',redo:'Refazer',fit:'Ajustar',duplicate_screen_short:'Dup Tela',duplicate_screen_tip:'Duplicar tela atual',save_component_tip:'Salvar grupo/seleção como componente',components:'Componentes',components_tip:'Biblioteca de componentes',basic_components:'Componentes Básicos',screens:'Telas',guides:'Guias',clear_guides:'Limpar guias',search_layers:'Buscar Camadas',layer_search_ph:'nome, tipo, grupo',layers:'Camadas',group_selected:'Agrupar selecionados',color_vars:'Variáveis de Cor',drop_hint:'Arraste imagens, SVG, GIF ou OBJ',select_element:'Selecione um elemento',to_edit:'para editar',multi_select:'Multisseleção',semantic_ph:'semântica...',position_size:'Posição e Tamanho',semantic_responsive:'Semântica e Responsivo',semantic_help:'Semântica diz o que o elemento é para a IA. Responsivo define como ele ancora quando a tela muda.',position:'Posição',rotation:'Rotação',description_comment:'Descrição / Comentário',perpetual:'Perpétuo',auto_keyframe:'Keyframe automático',actions:'Ações',saved:'salvo',active:'ativa',inactive:'desativada',no_timeline_elements:'Nenhum elemento na timeline',timeline_empty_hint:'Adicione elementos ao canvas para criar trilhas e keyframes.',no_guides:'Nenhuma',none:'nenhuma',untitled_group:'Sem grupo',perpetual_short:'perpétuo',export_json_cmd:'Exportar JSON',select_all:'Selecionar tudo',import_asset:'Importar asset',create_text:'Criar texto',create_note:'Criar nota',save_component:'Salvar componente',duplicate_screen:'Duplicar tela',fit_canvas:'Ajustar canvas',command_palette:'Paleta de comandos',search_command_ph:'buscar comando',no_history:'Sem histórico ainda',import_btn:'+ Importar',font_btn:'+ Fonte',add_screen:'+ Tela',templates:'Templates',clear:'Limpar',save_project:'Salvar Projeto',import_project:'Importar Projeto',import_json:'Importar JSON',assets:'Assets',basic_component_search_ph:'buscar componente',name_ph:'nome',opacity:'Opacidade',states:'Estados',text:'Texto',size:'Tamanho',all:'Todos',kf_here:'KF aqui',text_size:'Tam',weight:'Peso',align:'Alinhar',identifier:'Identificador',timeline:'Timeline',enter:'Entra',exit:'Sai',click:'Ao Clicar',hover:'Ao Passar Mouse',replace_with:'Substituir por',what_happens:'O que acontece...',new_project_tip:'Novo projeto',import_assets_tip:'Importar imagens, SVG, GIF ou OBJ',import_font_tip:'Importar fonte TTF/OTF/WOFF',select_tool_tip:'Selecionar (V)',text_tool_tip:'Texto (T)',note_tool_tip:'Nota (N)',eraser_tip:'Borracha',crop_tip:'Recortar',brush_color_tip:'Cor do brush',brush_size_tip:'Tamanho do brush',exit_preview:'Sair do Preview',exit_preview_tip:'Sair do preview',ref_object:'objeto ref'},
  en:{custom:'Custom',history:'History',command_palette_tip:'Command palette (Ctrl+K)',preview_tip:'Preview without panels (P)',history_tip:'Visual history',language_tip:'Change language',rulers:'Rulers',rulers_tip:'Show rulers and create guides',undo:'Undo',redo:'Redo',fit:'Fit',duplicate_screen_short:'Dup Screen',duplicate_screen_tip:'Duplicate current screen',save_component_tip:'Save group/selection as component',components:'Components',components_tip:'Component library',basic_components:'Basic Components',screens:'Screens',guides:'Guides',clear_guides:'Clear guides',search_layers:'Search Layers',layer_search_ph:'name, type, group',layers:'Layers',group_selected:'Group selected',color_vars:'Color Variables',drop_hint:'Drop images, SVG, GIF or OBJ',select_element:'Select an element',to_edit:'to edit',multi_select:'Multi-selection',semantic_ph:'semantic...',position_size:'Position and Size',semantic_responsive:'Semantic and Responsive',semantic_help:'Semantic tells the AI what the element is. Responsive defines how it anchors when the screen changes.',position:'Position',rotation:'Rotation',description_comment:'Description / Comment',perpetual:'Perpetual',auto_keyframe:'Auto keyframe',actions:'Actions',saved:'saved',active:'active',inactive:'inactive',no_timeline_elements:'No elements in the timeline',timeline_empty_hint:'Add elements to the canvas to create tracks and keyframes.',no_guides:'None',none:'none',untitled_group:'No group',perpetual_short:'perpetual',export_json_cmd:'Export JSON',select_all:'Select all',import_asset:'Import asset',create_text:'Create text',create_note:'Create note',save_component:'Save component',duplicate_screen:'Duplicate screen',fit_canvas:'Fit canvas',command_palette:'Command Palette',search_command_ph:'search command',no_history:'No history yet',import_btn:'+ Import',font_btn:'+ Font',add_screen:'+ Screen',templates:'Templates',clear:'Clear',save_project:'Save Project',import_project:'Import Project',import_json:'Import JSON',assets:'Assets',basic_component_search_ph:'search component',name_ph:'name',opacity:'Opacity',states:'States',text:'Text',size:'Size',all:'All',kf_here:'KF here',text_size:'Size',weight:'Weight',align:'Align',identifier:'Identifier',timeline:'Timeline',enter:'In',exit:'Out',click:'On Click',hover:'On Hover',replace_with:'Replace with',what_happens:'What happens...',new_project_tip:'New project',import_assets_tip:'Import images, SVG, GIF or OBJ',import_font_tip:'Import TTF/OTF/WOFF font',select_tool_tip:'Select (V)',text_tool_tip:'Text (T)',note_tool_tip:'Note (N)',eraser_tip:'Eraser',crop_tip:'Crop',brush_color_tip:'Brush color',brush_size_tip:'Brush size',exit_preview:'Exit Preview',exit_preview_tip:'Exit preview',ref_object:'ref object'}
};
function lang(){return st()?.lang||localStorage.getItem('lb7lang')||'pt';}
function tr(key){return (I18N[lang()]&&I18N[lang()][key])||I18N.pt[key]||key;}
function applyLang(){
  const l=lang();document.documentElement.lang=l==='pt'?'pt-BR':'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{el.title=tr(el.dataset.i18nTitle);});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{el.placeholder=tr(el.dataset.i18nPlaceholder);});
  applyStaticLang();
  const b=document.getElementById('btn-lang');if(b)b.textContent=l==='pt'?'PT':'EN';
  const status=document.getElementById('tlstatus');if(status){const s=st();status.textContent=s?.tlActive?tr('active'):tr('inactive');}
}
function toggleLang(){const s=st();if(!s)return;s.lang=lang()==='pt'?'en':'pt';localStorage.setItem('lb7lang',s.lang);applyLang();buildGuidesList();buildTL();saveLs();}

function setTxt(sel,key){const el=document.querySelector(sel);if(el)el.textContent=tr(key);}
function setTitle(sel,key){const el=document.querySelector(sel);if(el)el.title=tr(key);}
function setPh(sel,key){const el=document.querySelector(sel);if(el)el.placeholder=tr(key);}
function applyStaticLang(){
  [
    ['button[onclick="triggerImport()"]','import_btn'],['button[onclick="triggerFontImport()"]','font_btn'],
    ['button[onclick="addScreen()"]','add_screen'],['button[onclick="openTemplateModal()"]','templates'],
    ['button[onclick="clearAll()"]','clear'],['button[onclick="saveProject()"]','save_project'],
    ['button[onclick="triggerLoadProject()"]','import_project'],['button[onclick="triggerLoadJSON()"]','import_json'],
    ['button[onclick="openExportModal()"]','export_json_cmd'],['#preview-exit','exit_preview'],
    ['#kf-cur-ind','kf_here'],['#kfb-size','size'],['#kfb-all','all']
  ].forEach(([sel,key])=>setTxt(sel,key));
  [['#tab-new','new_project_tip'],['button[onclick="triggerImport()"]','import_assets_tip'],['button[onclick="triggerFontImport()"]','import_font_tip'],['#tool-sel','select_tool_tip'],['#tool-txt','text_tool_tip'],['#tool-note','note_tool_tip'],['#tool-eraser','eraser_tip'],['#tool-crop','crop_tip'],['#brush-color','brush_color_tip'],['#brush-size','brush_size_tip'],['#preview-exit','exit_preview_tip']].forEach(([sel,key])=>setTitle(sel,key));
  [['#basic-component-search','basic_component_search_ph'],['#vname','name_ph'],['#pcomponent','components'],['#pclick','what_happens'],['#phover','what_happens']].forEach(([sel,key])=>setPh(sel,key));
  document.querySelectorAll('.pt').forEach(el=>{const t=el.textContent.trim();if(t==='Assets')el.firstChild.textContent=tr('assets');});
  const titleMap={'Opacidade':'opacity','Opacity':'opacity','Estados':'states','States':'states','Texto':'text','Text':'text','Alinhar':'align','Align':'align','Identificador':'identifier','Identifier':'identifier','Timeline':'timeline'};
  document.querySelectorAll('#right .plbl').forEach(el=>{const span=el.querySelector(':scope > span');const target=span&&span.children.length?span:null;const raw=(target?target.childNodes[0]?.textContent:el.childNodes[0]?.textContent||'').trim();const key=titleMap[raw];if(key){if(target&&target.childNodes[0])target.childNodes[0].textContent=tr(key)+' ';else el.childNodes[0].textContent=tr(key);}});
  const pks=[...document.querySelectorAll('#tprops .pk')];if(pks[1])pks[1].textContent=tr('text_size');if(pks[2])pks[2].textContent=tr('weight');
  const aref=document.querySelector('#aref option[value=""]');if(aref)aref.textContent=tr('ref_object');
  const pgroup=document.querySelector('#pgroup option[value=""]');if(pgroup)pgroup.textContent=tr('untitled_group');
  document.querySelectorAll('#tltiming .prow span').forEach(sp=>{if(['Entra','In'].includes(sp.textContent.trim()))sp.textContent=tr('enter');if(['Sai','Out'].includes(sp.textContent.trim()))sp.textContent=tr('exit');});
  document.querySelectorAll('#props label.tr').forEach(lb=>{const txt=lb.textContent.trim();if(['Ao Clicar','On Click'].includes(txt))lb.lastChild.textContent=' '+tr('click');if(['Ao Passar Mouse','On Hover'].includes(txt))lb.lastChild.textContent=' '+tr('hover');if(['Substituir por','Replace with'].includes(txt))lb.lastChild.textContent=' '+tr('replace_with');});
  const autosave=document.getElementById('autosave-status');if(autosave&&/^(salvo|saved)$/i.test(autosave.textContent.trim()))autosave.textContent=tr('saved');
}

function initInspectorSections(){
  document.querySelectorAll('#right .pg').forEach((pg,i)=>{
    if(pg.classList.contains('collapsible'))return;
    const title=pg.querySelector(':scope > .plbl');if(!title)return;
    const key='lb7pg:'+((title.textContent||'section').trim().toLowerCase().replace(/\s+/g,'-')||i);
    const body=document.createElement('div');body.className='pg-body';
    [...pg.childNodes].forEach(n=>{if(n!==title)body.appendChild(n);});
    pg.appendChild(body);pg.classList.add('collapsible');pg.dataset.pgKey=key;
    if(localStorage.getItem(key)==='closed')pg.classList.add('collapsed');
    title.addEventListener('click',e=>{
      if(e.target.closest('button,input,select,textarea,label'))return;
      pg.classList.toggle('collapsed');
      localStorage.setItem(key,pg.classList.contains('collapsed')?'closed':'open');
    });
  });
}

// -----------------------------------
// PROJECT STATE
// -----------------------------------
let projects=[], activeId=null;
function newState(){
  return {elements:[],screens:[{id:1,name:'Tela 1',type:'page',h:1080}],
    groups:{},colorVars:[],guides:{h:[],v:[]},fonts:[],components:[],
    lang:localStorage.getItem('lb7lang')||'pt',
    screenW:1920,screenH:1080,screenType:'desktop',
    tlActive:false,tlFrame:0,tlTotal:120,tlFPS:24,tlFrameW:11,tlAutoKF:false,
    collapsedGroups:{},history:[],
    undoStack:[],redoStack:[],nextId:1};
}
const gp=()=>projects.find(p=>p.id===activeId);
const st=()=>gp()?.state;
function saveLs(){
  try{
    localStorage.setItem('lb7',JSON.stringify(projects.map(p=>({id:p.id,name:p.name,state:{...p.state,elements:p.state.elements.map(e=>{const c={...e};delete c._3dOn;delete c.objText;return c;}),undoStack:[],redoStack:[]}}))));
    localStorage.setItem('lb7a',activeId);
    updateAutosaveStatus(tr('saved')+' '+new Date().toLocaleTimeString());
  }catch(e){}
}
function loadLs(){
  try{
    const d=JSON.parse(localStorage.getItem('lb7')||'null');
    if(d?.length){projects=d.map(p=>({...p,state:hydrateState({...p.state,undoStack:[],redoStack:[]})}));activeId=localStorage.getItem('lb7a')||projects[0].id;return;}
  }catch(e){}
  projects=[{id:'p1',name:'Projeto 1',state:newState()}];activeId='p1';
}

// -----------------------------------
// TABS
// -----------------------------------
function addTab(){const id='p'+Date.now();projects.push({id,name:'Projeto '+(projects.length+1),state:newState()});switchTab(id);saveLs();}
function switchTab(id){activeId=id;renderTabs();applyUI();saveLs();}
function closeTab(id,e){e.stopPropagation();if(projects.length===1){toast('Minimo um projeto');return;}projects=projects.filter(p=>p.id!==id);if(activeId===id)activeId=projects[0].id;renderTabs();applyUI();saveLs();}
function renderTabs(){
  const c=document.getElementById('tabs-container');c.innerHTML='';
  projects.forEach(p=>{
    const t=document.createElement('div');t.className='tab'+(p.id===activeId?' active':'');
    t.innerHTML=`<span ondblclick="renameTab('${p.id}')" style="cursor:text">${escH(p.name)}</span><span class=\"tab-x\" onclick=\"closeTab('${p.id}',event)\">x</span>`;
    t.onclick=()=>switchTab(p.id);c.appendChild(t);
  });
}
function renameTab(id){const p=projects.find(x=>x.id===id);if(!p)return;openM('Renomear',`<label>Nome</label><input id="m-tn" value="${escH(p.name)}">`,()=>{p.name=document.getElementById('m-tn').value||p.name;renderTabs();saveLs();});}

// -----------------------------------
// UI STATE
// -----------------------------------
let sel=[], clipboard=null;
let gridOn=false,snapOn=true,rulersOn=false,mmOn=false;
let zoom=DEFZOOM,tool='sel';
let isDrag=false,isResize=false,isRot=false,isMarq=false,isPan=false;
let dragOX=0,dragOY=0,resW=0,resH=0,resX=0,resY=0;
let rotSA=0,rotEA=0,rotCX=0,rotCY=0;
let marqX=0,marqY=0;
let panSX=0,panSY=0,panScrollX=0,panScrollY=0;
let ctxTgt=null,modalCb=null,guideDrag=null,phDrag=false;
let layDragId=null;
let tlPlay=false,tlLastT=0,tlAccum=0,tlFrameW=11;
let previewMode=false,previewSwaps=new Map();
let brushDrag=null;
let brushNewLayerNext=false;
let cropDrag=null;
let cropSelection=null;

const cv=()=>document.getElementById('canvas');
const cW=()=>{const s=st();return s?s.screenW+(s.screens||[]).slice(1).filter(sc=>sc.type==='scroll-h').reduce((a,sc)=>a+(sc.w||sc.h||s.screenW),0):1920;};
const cH=()=>{const s=st();return s?s.screenH+(s.screens||[]).slice(1).filter(sc=>sc.type!=='scroll-h').reduce((a,sc)=>a+(sc.h||s.screenH),0):1080;};
const frameSec=(frames,fps=st()?.tlFPS||24)=>+((frames||0)/fps).toFixed(2);
function hydrateState(s){
  if(!s)return s;
  s.lang=s.lang||localStorage.getItem('lb7lang')||'pt';
  s.tlFPS=s.tlFPS||24;s.tlFrameW=s.tlFrameW||11;s.tlAutoKF=!!s.tlAutoKF;s.collapsedGroups=s.collapsedGroups||{};s.history=s.history||[];s.components=s.components||[];
  s.elements=(s.elements||[]).map(el=>({...mkElDefaults(),...el,keyframes:(el.keyframes||[]).map(k=>({ease:'linear',...k}))}));
  return s;
}
function mkElDefaults(){
  return {rotation:0,opacity:1,desc:'',visible:true,locked:false,group:'',semanticRole:'',constraints:{x:'left',y:'top'},states:{normal:true,hover:false,active:false,disabled:false,loading:false,error:false},componentName:'',shapeVariant:'',shapeStyle:{},brushStrokes:[],cutouts:[],pastedFragments:[],cropFragment:null,frameIn:0,frameOut:119,perpetuo:true,gifMode:'loop',colorVar:'',textContent:'',fontFamily:'system-ui',fontSize:16,fontWeight:'400',fontColor:'#111111',textAlign:'left',keyframes:[],actions:{click:{enabled:false,desc:'',swap:false,swapTarget:''},hover:{enabled:false,desc:'',swap:false,swapTarget:''}}};
}
function updateAutosaveStatus(msg){const el=document.getElementById('autosave-status');if(el)el.textContent=msg;}
function logAction(msg){const s=st();if(!s)return;s.history=s.history||[];s.history.unshift({at:new Date().toISOString(),message:msg});s.history=s.history.slice(0,80);}

// -----------------------------------
// APPLY UI
// -----------------------------------
function applyUI(){
  const s=st();if(!s)return;
  hydrateState(s);tlFrameW=s.tlFrameW||11;
  applyLang();
  sel=[];
  document.querySelectorAll('.el,.onion,.gbox,.sdiv,.gh,.gv').forEach(d=>d.remove());
  cv().classList.remove('has-el');
  applyCS();
  ['desktop','mobile'].forEach(id=>document.getElementById('btn-'+id).classList.toggle('on',id===s.screenType));
  const basicSearch=document.getElementById('basic-component-search');if(basicSearch)basicSearch.value='';
  setZoom(DEFZOOM);
  centerCanvas();
  s.elements.forEach(el=>renderEl(el));
  if(s.elements.length)cv().classList.add('has-el');
  buildSdivs();buildGuides();buildGuidesList();updateLayers();buildScrPanel();renderAssets();renderBasicComponents();renderVars();
  setTool(tool||'sel');
  setTimeout(renderBasicComponents,0);setTimeout(renderBasicComponents,80);
  const on=s.tlActive;
  document.getElementById('tl').classList.toggle('show',on);
  document.getElementById('tlicon').textContent=on?'-':'+';
  document.getElementById('tlstatus').textContent=on?tr('active'):tr('inactive');
  document.getElementById('tlpg').style.display=on?'':'none';
  document.getElementById('kfpg').style.display=on?'':'none';
  if(on){buildTL();applyFrame(s.tlFrame);}
  document.getElementById('sz').textContent=cW()+' x '+cH();
  deselAll();updateGroupSel();applyImportedFonts();
  toast(''+gp()?.name);
}
function applyCS(){const s=st();if(!s)return;cv().style.width=cW()+'px';cv().style.height=cH()+'px';}
